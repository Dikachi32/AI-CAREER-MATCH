"""
backend/app.py — AI Career Match Production API Server
======================================================
Phase 8 — Rate Limiting & Production Stability

Architecture: Flask + SQLAlchemy + JWT + CORS + Blueprints + Rate Limiting
Phases Integrated: 1 (Core), 2 (AI Career Intelligence V2), 3 (Roadmap),
                   4 (CV Optimizer), 5 (Interview Copilot), 6 (Career Dashboard)

Role: Central application factory and route registry.
All business logic lives in services/, routes/, preprocessing/, recommendation/.

Production Notes:
- Uses GEMINI_MODEL=gemini-2.5-flash as specified.
- All endpoints preserve existing contracts (backward compatible).
- Duplicate /optimize_cv endpoints merged into single authoritative endpoint.
- Phase 2 V2 routes properly registered under /api/v2/ai-career/*.
- AIProfile import fixed for Phase 3 endpoints.
- Centralized input validation with length guards and type checks.
- Sensitive exception details are NEVER exposed to API users in production.
- Structured JSON error responses with consistent schema across all endpoints.
- CORS handled globally via after_request to ensure headers on ALL responses.
- Request logging with request-id tracing, health checks (including DB), and
  input validation added.
- Rate limiting via Flask-Limiter: per-user, per-IP, and per-endpoint tiers.

Rate Limiting Strategy (Phase 8):
- AI-intensive endpoints: 10/minute per user (protect API costs)
- Auth endpoints: 5/minute per IP (brute-force protection)
- General authenticated API: 60/minute per user
- Health/Stats: 30/minute per IP
- Saved jobs CRUD: 30/minute per user
- Default fallback: 200/hour per IP

Storage: in-memory (dev) or Redis (production) via RATELIMIT_STORAGE_URI.

Author: AI Career Match Engineering Team
Version: 8.0.0
"""

import os
import sys
import signal
import logging
import traceback
import json
import uuid
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

from flask import Flask, request, jsonify, g, Response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge, BadRequest, NotFound
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

# ── Local Imports ──────────────────────────────────────────────────────────
from config import Config
from models import db, User, AIProfile
from auth import auth_bp, bcrypt

# Preprocessing
from preprocessing.cv_parser import parse_cv
from preprocessing.skill_extractor import extract_skills

# Recommendation engine
from recommendation.embedding_matcher import JobMatcher
from recommendation.job_fetcher import fetch_real_jobs

# Services (Phase 1 legacy + Phase 3 + Phase 4)
from services.ai_job_intelligence import analyze_job_intelligence, match_cv_to_job
from services.ai_skill_analytics import analyze_skills
from services.ai_career_intelligence import generate_career_roadmap, generate_combined_intelligence
from services.cv_optimizer import optimize_cv, quick_ats_check

# Phase 5 & 6
from interview_copilot import generate_interview_prep
from career_coach import generate_career_dashboard

# Route Blueprints
from routes.ai_career_intelligence import ai_career_bp

# Phase 2 V2 Routes (must be imported explicitly)
try:
    from routes.ai_career_intelligence import ai_career_v2_bp
    _PHASE2_V2_AVAILABLE = True
except ImportError:
    _PHASE2_V2_AVAILABLE = False
    ai_career_v2_bp = None

# ── Logging Configuration ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai_career_match")

# Silence overly verbose third-party loggers in production
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

# ── Constants ──────────────────────────────────────────────────────────────
MAX_JSON_PAYLOAD_SIZE = 2 * 1024 * 1024       # 2 MB max JSON body
MAX_CV_TEXT_LENGTH = 50_000                   # chars
MAX_JOB_DESC_LENGTH = 30_000                  # chars
MAX_JOB_TITLE_LENGTH = 200                    # chars
MAX_STRING_FIELD_LENGTH = 500                 # generic string cap
MAX_EMAIL_LENGTH = 254                        # RFC 5321
MAX_PASSWORD_LENGTH = 128                     # sensible upper bound
MAX_NAME_LENGTH = 100                           # display name

# ── Rate Limit Key Functions ───────────────────────────────────────────────

def _rate_limit_key_user() -> str:
    """Return the authenticated user ID for per-user rate limiting.
    Falls back to remote IP if not authenticated.
    """
    try:
        identity = get_jwt_identity()
        if identity:
            return f"user:{identity}"
    except Exception:
        pass
    return f"ip:{get_remote_address()}"


def _rate_limit_key_ip() -> str:
    """Return the remote IP address for per-IP rate limiting."""
    return get_remote_address()


# ── Flask App Factory ────────────────────────────────────────────────────────

def create_app(config_class: type = Config) -> Flask:
    """Application factory. Returns a configured Flask app instance."""

    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Register globally; after_request ensures headers on error responses too.
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config.get("CORS_ORIGINS", ["http://localhost:3000"]),
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "max_age": 86400,
        },
        r"/health": {
            "origins": "*",
            "methods": ["GET", "OPTIONS"],
        },
        r"/stats": {
            "origins": "*",
            "methods": ["GET", "OPTIONS"],
        },
    })

    # ── Rate Limiter ─────────────────────────────────────────────────────────
    # Flask-Limiter integration.  Storage backend defaults to in-memory;
    # production should set RATELIMIT_STORAGE_URI to a Redis instance.
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        storage_uri=app.config.get("RATELIMIT_STORAGE_URI", "memory://"),
        strategy=app.config.get("RATELIMIT_STRATEGY", "fixed-window"),
        enabled=app.config.get("RATELIMIT_ENABLED", True),
        default_limits=[app.config.get("RATELIMIT_DEFAULT", "200 per hour")],
        headers_enabled=True,  # Expose X-RateLimit-* headers
    )
    app.extensions["limiter"] = limiter
    logger.info(
        "Rate limiter initialized — storage=%s strategy=%s enabled=%s",
        app.config.get("RATELIMIT_STORAGE_URI", "memory://"),
        app.config.get("RATELIMIT_STRATEGY", "fixed-window"),
        app.config.get("RATELIMIT_ENABLED", True),
    )

    # ── Extensions ─────────────────────────────────────────────────────────
    jwt = JWTManager(app)
    db.init_app(app)
    bcrypt.init_app(app)

    # ── Blueprints ─────────────────────────────────────────────────────────
    app.register_blueprint(auth_bp)                     # /auth/*
    app.register_blueprint(ai_career_bp)                  # Phase 1 legacy routes

    if _PHASE2_V2_AVAILABLE and ai_career_v2_bp is not None:
        app.register_blueprint(ai_career_v2_bp)           # /api/v2/ai-career/*
        logger.info("Phase 2 V2 routes registered: /api/v2/ai-career/*")
    else:
        logger.warning("Phase 2 V2 routes NOT available — ai_career_v2_bp import failed")

    # ── Database ─────────────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()
        logger.info("Database tables ensured (create_all).")

    # ── Uploads ──────────────────────────────────────────────────────────────
    os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads"), exist_ok=True)

    # ── Job Matcher Singleton ──────────────────────────────────────────────
    matcher = JobMatcher(
        model_name=app.config.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2"),
        jobs_json_path=app.config.get("JOBS_JSON_PATH"),
    )
    app.extensions["job_matcher"] = matcher
    logger.info("JobMatcher singleton initialized.")

    # ── Helper: CORS headers on every response ───────────────────────────────
    @app.after_request
    def _inject_cors_headers(response: Response) -> Response:
        origin = request.headers.get("Origin", "")
        allowed = app.config.get("CORS_ORIGINS", [])
        if origin and origin in allowed:
            response.headers.setdefault("Access-Control-Allow-Origin", origin)
            response.headers.setdefault("Access-Control-Allow-Credentials", "true")
            response.headers.setdefault(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With",
            )
            response.headers.setdefault(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            )
        # Security headers
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return response

    # ── Request Lifecycle ────────────────────────────────────────────────────
    @app.before_request
    def _before_request():
        # Attach request start time for latency logging
        g.request_start_time = datetime.utcnow()
        # Generate request-id for distributed tracing / log correlation
        g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])

        # JSON payload size guard
        if request.is_json and request.content_length and request.content_length > MAX_JSON_PAYLOAD_SIZE:
            logger.warning(
                "[req:%s] Payload too large: %s bytes from %s",
                g.request_id, request.content_length, request.remote_addr,
            )
            return jsonify({"error": "Payload too large. Max JSON body is 2MB."}), 413

        # Reject non-JSON bodies for POST/PUT/PATCH on API routes
        if (
            request.method in ("POST", "PUT", "PATCH")
            and request.path.startswith("/api/")
            and request.content_type
            and "application/json" not in request.content_type
            and not request.files
        ):
            logger.warning(
                "[req:%s] Invalid Content-Type for %s %s: %s",
                g.request_id, request.method, request.path, request.content_type,
            )
            return jsonify({"error": "Content-Type must be application/json"}), 415

        if app.debug:
            logger.debug(
                "[req:%s] → %s %s | Content-Type: %s",
                g.request_id, request.method, request.path, request.content_type,
            )

    @app.after_request
    def _after_request(response: Response) -> Response:
        if hasattr(g, "request_start_time"):
            latency_ms = (datetime.utcnow() - g.request_start_time).total_seconds() * 1000
            logger.info(
                "[req:%s] ← %s %s | %s | %.1fms | %s",
                getattr(g, "request_id", "—"),
                request.method,
                request.path,
                response.status_code,
                latency_ms,
                request.remote_addr,
            )
        return response

    # ── Error Handlers ───────────────────────────────────────────────────────
    @app.errorhandler(400)
    def _bad_request(error):
        logger.warning("[req:%s] 400 Bad Request: %s — %s", getattr(g, "request_id", "—"), request.path, error)
        return jsonify({"error": "Bad request", "details": str(error) if app.debug else None}), 400

    @app.errorhandler(404)
    def _not_found(error):
        return jsonify({"error": "Resource not found", "path": request.path}), 404

    @app.errorhandler(405)
    def _method_not_allowed(error):
        return jsonify({
            "error": "Method not allowed",
            "allowed_methods": getattr(error, "valid_methods", []),
        }), 405

    @app.errorhandler(413)
    def _payload_too_large(error):
        max_mb = app.config.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024) // (1024 * 1024)
        return jsonify({"error": f"File too large. Max size is {max_mb}MB."}), 413

    @app.errorhandler(415)
    def _unsupported_media_type(error):
        return jsonify({"error": "Unsupported Media Type. Expected application/json."}), 415

    @app.errorhandler(429)
    def _rate_limited(error):
        # Flask-Limiter passes a RateLimitExceeded object with description
        retry_after = getattr(error, "retry_after", None)
        resp = jsonify({
            "error": "Rate limit exceeded. Please slow down.",
            "retry_after": retry_after,
        })
        if retry_after:
            resp.headers["Retry-After"] = str(retry_after)
        return resp, 429

    @app.errorhandler(500)
    def _internal_error(error):
        db.session.rollback()
        logger.exception("[req:%s] 500 Internal Server Error at %s", getattr(g, "request_id", "—"), request.path)
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(RequestEntityTooLarge)
    def _request_entity_too_large(error):
        max_mb = app.config.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024) // (1024 * 1024)
        return jsonify({"error": f"File too large. Max size is {max_mb}MB."}), 413

    @app.errorhandler(Exception)
    def _unhandled_exception(error):
        """Catch-all: logs, rolls back DB, returns JSON with CORS headers."""
        db.session.rollback()
        logger.exception(
            "[req:%s] Unhandled exception at %s: %s",
            getattr(g, "request_id", "—"), request.path, error,
        )
        details = str(error) if app.debug else None
        return jsonify({"error": "Internal server error", "details": details}), 500

    # ── JWT Error Handlers ───────────────────────────────────────────────────
    @jwt.expired_token_loader
    def _expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Token expired. Please log in again."}), 401

    @jwt.invalid_token_loader
    def _invalid_token(error):
        return jsonify({"error": "Invalid authentication token.", "details": str(error) if app.debug else None}), 422

    @jwt.unauthorized_loader
    def _unauthorized(error):
        return jsonify({"error": "Authorization required. Please log in."}), 401

    @jwt.needs_fresh_token_loader
    def _needs_fresh(jwt_header, jwt_payload):
        return jsonify({"error": "Fresh token required. Please log in again."}), 401

    @jwt.revoked_token_loader
    def _revoked(jwt_header, jwt_payload):
        return jsonify({"error": "Token has been revoked. Please log in again."}), 401

    # ── Input Validation Helpers ─────────────────────────────────────────────
    def _sanitize_string(value: Any, max_length: int = MAX_STRING_FIELD_LENGTH) -> str:
        """Coerce to string, strip whitespace, truncate. Returns empty string for None."""
        if value is None:
            return ""
        s = str(value).strip()
        return s[:max_length]

    def _require_json_field(data: dict, field: str, max_length: int = MAX_STRING_FIELD_LENGTH) -> str:
        """Extract and validate a required string field from JSON payload.

        Raises BadRequest with a clear message if the field is missing or empty.
        """
        if not isinstance(data, dict):
            raise BadRequest("Request body must be a JSON object.")
        val = _sanitize_string(data.get(field, ""), max_length)
        if not val:
            raise BadRequest(f"`{field}` is required and cannot be empty.")
        return val

    def _validate_integer(
        value: Any,
        field_name: str = "value",
        min_value: Optional[int] = None,
        max_value: Optional[int] = None,
        default: Optional[int] = None,
    ) -> int:
        """Validate and coerce a value to integer with optional bounds.

        Returns default if value is None and default is provided.
        Raises BadRequest on invalid input.
        """
        if value is None and default is not None:
            return default
        if value is None:
            raise BadRequest(f"`{field_name}` is required.")
        try:
            iv = int(value)
        except (ValueError, TypeError):
            raise BadRequest(f"`{field_name}` must be a valid integer.")
        if min_value is not None and iv < min_value:
            raise BadRequest(f"`{field_name}` must be at least {min_value}.")
        if max_value is not None and iv > max_value:
            raise BadRequest(f"`{field_name}` must be at most {max_value}.")
        return iv

    def _safe_error_details(exc: Exception) -> Optional[str]:
        """Return exception details ONLY in debug mode. Prevents info leakage."""
        return str(exc) if app.debug else None

    def _get_user_or_404(user_id) -> User:
        """Fetch user by ID or raise NotFound (404)."""
        user = User.query.get(user_id)
        if not user:
            raise NotFound("User not found")
        return user

    def _get_user_cv_text_and_skills(user: User) -> Tuple[str, List[str]]:
        """Extract CV text and skills from user, preferring AIProfile then legacy cv_data."""
        cv_text = ""
        user_skills: List[str] = []

        # Phase 2: AIProfile first
        ai_profile = AIProfile.query.filter_by(user_id=user.id).first()
        if ai_profile and ai_profile.raw_text:
            cv_text = ai_profile.raw_text
            user_skills = ai_profile.get_json_field("technical_skills")

        # Fallback: legacy cv_data blob
        if not cv_text and user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get("raw_text", "") or cv_data.get("cleaned_text", "")
                if not user_skills:
                    legacy_skills = cv_data.get("extracted_skills", {})
                    if isinstance(legacy_skills, dict):
                        user_skills = legacy_skills.get("technical", []) + legacy_skills.get("soft", [])
                    elif isinstance(legacy_skills, list):
                        user_skills = legacy_skills
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data

        return cv_text, user_skills

    def _check_premium_or_abort(user: User, feature_name: str = "This feature"):
        """Abort with 403 if user is not on premium tier."""
        if user.subscription_tier != "premium":
            raise BadRequest(f"{feature_name} requires Premium subscription.")

    # ── Health & Stats ───────────────────────────────────────────────────────
    @app.route("/health", methods=["GET"])
    @limiter.limit("30 per minute")
    def health():
        """Liveness + readiness probe. Verifies DB connectivity."""
        db_healthy = False
        try:
            db.session.execute(db.text("SELECT 1"))
            db_healthy = True
        except Exception as e:
            logger.error("[req:%s] Health check DB failure: %s", getattr(g, "request_id", "—"), e)

        status_code = 200 if db_healthy else 503
        return jsonify({
            "status": "AI Career Recommendation API is running",
            "version": "8.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "environment": "development" if app.debug else "production",
            "database": "healthy" if db_healthy else "unhealthy",
            "phases": {
                "phase1_core": True,
                "phase2_v2_intelligence": _PHASE2_V2_AVAILABLE,
                "phase3_roadmap": True,
                "phase4_cv_optimizer": True,
                "phase5_interview_copilot": True,
                "phase6_career_dashboard": True,
            },
        }), status_code

    @app.route("/stats", methods=["GET"])
    @limiter.limit("30 per minute")
    def get_stats():
        """Public demo statistics."""
        return jsonify({
            "jobs_analyzed": 50_000,
            "cvs_processed": 10_000,
            "matching_accuracy": 95,
            "partner_companies": 500,
            "active_users": 2_500,
        }), 200

    # ── Subscription (Demo) ──────────────────────────────────────────────────
    @app.route("/subscription", methods=["GET"])
    @jwt_required()
    @limiter.limit("60 per minute", key_func=_rate_limit_key_user)
    def get_subscription():
        user_id = get_jwt_identity()
        user = _get_user_or_404(user_id)

        features = (
            Config.DEMO_PREMIUM_FEATURES
            if user.subscription_tier == "premium"
            else Config.DEMO_FREE_FEATURES
        )

        return jsonify({
            "tier": user.subscription_tier,
            "status": user.subscription_status,
            "expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
            "is_demo": True,
            "features": features,
        }), 200

    @app.route("/subscription/demo-toggle", methods=["POST"])
    @jwt_required()
    @limiter.limit("10 per minute", key_func=_rate_limit_key_user)
    def toggle_demo_subscription():
        user_id = get_jwt_identity()
        user = _get_user_or_404(user_id)

        data = request.get_json(silent=True) or {}
        target_tier = data.get("tier", "premium" if user.subscription_tier == "free" else "free")

        # Sanitize tier value
        target_tier = _sanitize_string(target_tier, 20)
        if target_tier not in ("free", "premium"):
            return jsonify({"error": "Invalid tier. Must be 'free' or 'premium'."}), 400

        user.subscription_tier = target_tier
        user.subscription_status = "active"
        user.subscription_expires_at = datetime.utcnow() if target_tier == "premium" else None
        db.session.commit()

        features = (
            Config.DEMO_PREMIUM_FEATURES
            if target_tier == "premium"
            else Config.DEMO_FREE_FEATURES
        )

        return jsonify({
            "message": f"Demo subscription changed to {target_tier}",
            "tier": target_tier,
            "features": features,
        }), 200

    # ── CV Upload ────────────────────────────────────────────────────────────
    ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS

    def _allowed_file(filename: str) -> bool:
        return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

    @app.route("/upload_cv", methods=["POST"])
    @jwt_required()
    @limiter.limit("30 per minute", key_func=_rate_limit_key_user)
    def upload_cv():
        """
        POST /upload_cv
        Upload a CV (PDF/DOCX) or paste raw text. Parses, extracts skills,
        updates user profile, and persists structured data.
        """
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            # ── Upload limit check (free tier) ───────────────────────────────
            if user.subscription_tier != "premium":
                has_cv = 1 if user.cv_data else 0
                if has_cv >= Config.DEMO_FREE_FEATURES.get("maxCVUploads", 3):
                    return jsonify({
                        "error": "Upload limit reached. Upgrade to Demo Premium for unlimited uploads.",
                        "limit_reached": True,
                    }), 403

            # ── File upload branch ───────────────────────────────────────────
            if "cv" in request.files:
                file = request.files["cv"]
                if file.filename == "":
                    return jsonify({"error": "No selected file"}), 400

                if not (file and _allowed_file(file.filename)):
                    return jsonify({"error": "Invalid file type. Only PDF and DOCX allowed."}), 400

                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                file.save(file_path)
                file_type = filename.rsplit(".", 1)[1].lower()
                location = _sanitize_string(request.form.get("location", ""), 200)

                try:
                    cv_data = parse_cv(file_path, file_type)
                    skills = extract_skills(cv_data["raw_text"])
                    info = cv_data["extracted_info"]

                    # Update user profile from CV
                    if info.get("full_name") and (not user.name or user.name == "User"):
                        user.name = info["full_name"]
                    if info.get("location"):
                        user.location = info["location"]
                    elif location:
                        user.location = location
                    if info.get("latest_job_title"):
                        user.title = info["latest_job_title"]
                    if info.get("current_company"):
                        user.company = info["current_company"]

                    # Persist CV data (size-limited)
                    user.cv_data = json.dumps({
                        "extracted_info": info,
                        "extracted_skills": skills,
                        "cleaned_text": cv_data["cleaned_text"],
                        "raw_text": cv_data["raw_text"][:5000],
                    })
                    user.cv_uploaded_at = datetime.utcnow()
                    db.session.commit()

                    return jsonify({
                        "message": "CV uploaded and processed successfully",
                        "extracted_skills": skills,
                        "extracted_info": info,
                        "cleaned_text_preview": cv_data["cleaned_text"][:500] + "...",
                        "user": user.to_dict(),
                    }), 200

                except Exception as e:
                    logger.exception("[req:%s] CV parsing failed", getattr(g, "request_id", "—"))
                    return jsonify({
                        "error": "Failed to parse CV",
                        "details": _safe_error_details(e),
                    }), 500

            # ── Text-only paste branch ───────────────────────────────────────
            data = request.get_json(silent=True) or {}
            cv_text = _sanitize_string(data.get("cv_text", ""), MAX_CV_TEXT_LENGTH)
            if not cv_text:
                return jsonify({"error": "No CV file or text provided"}), 400

            skills = extract_skills(cv_text)

            user.cv_data = json.dumps({
                "extracted_info": {},
                "extracted_skills": skills,
                "cleaned_text": cv_text[:10000],
                "raw_text": cv_text[:5000],
            })
            user.cv_uploaded_at = datetime.utcnow()
            db.session.commit()

            return jsonify({
                "message": "CV text processed successfully",
                "extracted_skills": skills,
                "user": user.to_dict(),
            }), 200

        except Exception as e:
            logger.exception("[req:%s] Upload CV endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Server error during CV upload",
                "details": _safe_error_details(e),
            }), 500

    # ── Job Recommendations ──────────────────────────────────────────────────
    @app.route("/recommendations", methods=["POST"])
    @jwt_required()
    @limiter.limit("60 per minute", key_func=_rate_limit_key_user)
    def get_recommendations():
        """
        POST /recommendations
        Fetch real jobs via JSearch API, match against user CV, enrich top 5 with AI.
        """
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            data = request.get_json(silent=True) or {}
            location = _sanitize_string(data.get("location", user.location or ""), 200)
            job_title = _sanitize_string(data.get("job_title", user.title or ""), MAX_JOB_TITLE_LENGTH)

            if not location and not job_title:
                return jsonify({"error": "Please provide location or job_title"}), 400

            # Fetch real jobs
            jobs = fetch_real_jobs(
                query=job_title or "software engineer",
                location=location or "United States",
            )

            # Extract CV text for matching
            cv_text, _ = _get_user_cv_text_and_skills(user)

            # Match
            matched_jobs = matcher.match_jobs(cv_text, jobs, top_n=10)

            # Enrich top 5 with AI intelligence
            enriched_jobs: List[Dict[str, Any]] = []
            for idx, job in enumerate(matched_jobs):
                job_copy = dict(job)
                if idx < 5:
                    try:
                        intelligence = analyze_job_intelligence(
                            job_title=job.get("title", ""),
                            job_description=job.get("description", ""),
                            company=job.get("company", ""),
                            industry=job.get("industry", ""),
                        )
                        job_copy["ai_intelligence"] = intelligence
                    except Exception as e:
                        logger.warning(
                            "[req:%s] AI enrichment failed for job %s: %s",
                            getattr(g, "request_id", "—"),
                            job.get("id", "unknown"),
                            e,
                        )
                        job_copy["ai_intelligence"] = {"error": "AI enrichment unavailable"}
                enriched_jobs.append(job_copy)

            return jsonify({
                "jobs": enriched_jobs,
                "total": len(enriched_jobs),
                "location": location,
                "query": job_title,
            }), 200

        except Exception as e:
            logger.exception("[req:%s] Recommendations endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to get recommendations",
                "details": _safe_error_details(e),
            }), 500

    # ── Legacy Job Intelligence ──────────────────────────────────────────────
    @app.route("/job-intelligence", methods=["POST"])
    @jwt_required()
    @limiter.limit("60 per minute", key_func=_rate_limit_key_user)
    def job_intelligence():
        """POST /job-intelligence — Legacy Phase 1 endpoint."""
        try:
            data = request.get_json(silent=True) or {}
            job_title = _require_json_field(data, "job_title", MAX_JOB_TITLE_LENGTH)
            job_description = _require_json_field(data, "job_description", MAX_JOB_DESC_LENGTH)

            intelligence = analyze_job_intelligence(
                job_title=job_title,
                job_description=job_description,
                company=_sanitize_string(data.get("company", ""), 200),
                industry=_sanitize_string(data.get("industry", ""), 100),
            )
            return jsonify({"intelligence": intelligence}), 200

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] Job intelligence endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to analyze job",
                "details": _safe_error_details(e),
            }), 500

    # ── CV-Job Matching ────────────────────────────────────────────────────────
    @app.route("/match-cv-job", methods=["POST"])
    @jwt_required()
    @limiter.limit("60 per minute", key_func=_rate_limit_key_user)
    def match_cv_job():
        """POST /match-cv-job — Match user CV against a specific job."""
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            data = request.get_json(silent=True) or {}
            job_title = _require_json_field(data, "job_title", MAX_JOB_TITLE_LENGTH)
            job_description = _require_json_field(data, "job_description", MAX_JOB_DESC_LENGTH)

            cv_text, user_skills = _get_user_cv_text_and_skills(user)
            if not cv_text:
                return jsonify({"error": "No CV found. Please upload a CV first."}), 400

            match_result = match_cv_to_job(
                cv_text=cv_text,
                job_title=job_title,
                job_description=job_description,
                user_skills=user_skills,
            )
            return jsonify({"match": match_result}), 200

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] Match CV-Job endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to match CV to job",
                "details": _safe_error_details(e),
            }), 500

    # ── Skill Analytics ──────────────────────────────────────────────────────
    @app.route("/skill-analytics", methods=["POST"])
    @jwt_required()
    @limiter.limit("60 per minute", key_func=_rate_limit_key_user)
    def skill_analytics():
        """POST /skill-analytics — Analyze user skills against target role."""
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            data = request.get_json(silent=True) or {}
            target_role = _require_json_field(data, "target_role", MAX_JOB_TITLE_LENGTH)

            _, user_skills = _get_user_cv_text_and_skills(user)
            if not user_skills:
                return jsonify({"error": "No skills found. Please upload a CV first."}), 400

            analytics = analyze_skills(user_skills=user_skills, target_role=target_role)
            return jsonify({"analytics": analytics}), 200

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] Skill analytics endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to analyze skills",
                "details": _safe_error_details(e),
            }), 500

    # ── CV Optimization (Merged — Single Authoritative Endpoint) ───────────
    @app.route("/optimize-cv", methods=["POST"])
    @jwt_required()
    @limiter.limit("10 per minute", key_func=_rate_limit_key_user)
    def optimize_cv_endpoint():
        """
        POST /optimize-cv
        Phase 4: AI-powered CV Optimizer & ATS Enhancement.
        Merged from legacy /optimize-cv (Phase 1) and Phase 4 implementation.
        Requires Premium subscription.
        """
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)
            _check_premium_or_abort(user, "CV optimization")

            data = request.get_json(silent=True) or {}
            target_job = _require_json_field(data, "target_job", MAX_JOB_TITLE_LENGTH)

            cv_text, _ = _get_user_cv_text_and_skills(user)
            if not cv_text:
                return jsonify({"error": "No CV found. Please upload a CV first."}), 400

            optimized = optimize_cv(cv_text=cv_text, target_job=target_job)

            return jsonify({
                "optimized_cv": optimized.get("optimized_text", ""),
                "improvements": optimized.get("improvements", []),
                "ats_score_before": optimized.get("ats_score_before", 0),
                "ats_score_after": optimized.get("ats_score_after", 0),
            }), 200

        except BadRequest as e:
            # Distinguish premium-check failures (403) from generic bad requests (400)
            status = 403 if "requires Premium" in str(e) else 400
            return jsonify({"error": str(e)}), status
        except Exception as e:
            logger.exception("[req:%s] CV optimization endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to optimize CV",
                "details": _safe_error_details(e),
            }), 500

    # ── Quick ATS Check ──────────────────────────────────────────────────────
    @app.route("/quick-ats-check", methods=["POST"])
    @jwt_required()
    @limiter.limit("10 per minute", key_func=_rate_limit_key_user)
    def quick_ats_check_endpoint():
        """
        POST /quick-ats-check
        Phase 4: Quick ATS compatibility check. Minimal token usage.
        """
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            data = request.get_json(silent=True) or {}
            job_title = _require_json_field(data, "job_title", MAX_JOB_TITLE_LENGTH)
            job_description = _require_json_field(data, "job_description", MAX_JOB_DESC_LENGTH)

            cv_text, _ = _get_user_cv_text_and_skills(user)
            if not cv_text:
                return jsonify({"error": "No CV found. Please upload a CV first."}), 400

            result = quick_ats_check(
                cv_text=cv_text,
                job_title=job_title,
                job_description=job_description,
            )

            if result.get("success"):
                return jsonify({
                    "success": True,
                    "ats_check": result["data"],
                    "source": result.get("source"),
                }), 200

            return jsonify({
                "success": False,
                "error": "ATS check failed",
                "details": result.get("error"),
            }), 503

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] Quick ATS check endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to check ATS compatibility",
                "details": _safe_error_details(e),
            }), 500

    # ── Phase 3: Career Roadmap ──────────────────────────────────────────────
    @app.route("/api/v3/ai-career/roadmap", methods=["POST"])
    @jwt_required()
    @limiter.limit("10 per minute", key_func=_rate_limit_key_user)
    def career_roadmap():
        """
        POST /api/v3/ai-career/roadmap
        Phase 3: Generate personalized career roadmap and skill gap analysis.
        """
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            data = request.get_json(silent=True) or {}
            job_title = _require_json_field(data, "job_title", MAX_JOB_TITLE_LENGTH)
            job_description = _require_json_field(data, "job_description", MAX_JOB_DESC_LENGTH)

            cv_text, user_skills = _get_user_cv_text_and_skills(user)
            if not cv_text:
                return jsonify({"error": "No CV found. Please upload a CV first."}), 400

            ai_profile = AIProfile.query.filter_by(user_id=user.id).first()

            result = generate_career_roadmap(
                cv_text=cv_text,
                job_title=job_title,
                job_description=job_description,
                company_name=_sanitize_string(data.get("company_name", ""), 200),
                industry=_sanitize_string(data.get("industry", ""), 100),
                ai_profile=ai_profile,
                user_skills=user_skills,
            )

            if result.get("success"):
                return jsonify({
                    "success": True,
                    "roadmap": result["data"],
                    "source": result.get("source"),
                    "model": result.get("model"),
                }), 200

            return jsonify({
                "success": False,
                "error": "Roadmap generation failed",
                "details": result.get("data", {}),
            }), 503

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] Career roadmap endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to generate career roadmap",
                "details": _safe_error_details(e),
            }), 500

    # ── Phase 3: Combined Intelligence ───────────────────────────────────────
    @app.route("/api/v3/ai-career/combined", methods=["POST"])
    @jwt_required()
    @limiter.limit("10 per minute", key_func=_rate_limit_key_user)
    def combined_intelligence():
        """
        POST /api/v3/ai-career/combined
        Phase 3: Generate both intelligence analysis AND career roadmap in one call.
        """
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            data = request.get_json(silent=True) or {}
            job_title = _require_json_field(data, "job_title", MAX_JOB_TITLE_LENGTH)
            job_description = _require_json_field(data, "job_description", MAX_JOB_DESC_LENGTH)

            cv_text, user_skills = _get_user_cv_text_and_skills(user)
            if not cv_text:
                return jsonify({"error": "No CV found. Please upload a CV first."}), 400

            ai_profile = AIProfile.query.filter_by(user_id=user.id).first()

            result = generate_combined_intelligence(
                cv_text=cv_text,
                job_title=job_title,
                job_description=job_description,
                company_name=_sanitize_string(data.get("company_name", ""), 200),
                industry=_sanitize_string(data.get("industry", ""), 100),
                ai_profile=ai_profile,
                user_skills=user_skills,
            )

            if result.get("success"):
                return jsonify({
                    "success": True,
                    "intelligence": result["data"]["intelligence"],
                    "roadmap": result["data"]["roadmap"],
                    "source": result.get("source"),
                    "model": result.get("model"),
                }), 200

            return jsonify({
                "success": False,
                "error": "Combined intelligence generation failed",
                "details": result.get("data", {}),
            }), 503

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] Combined intelligence endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to generate combined intelligence",
                "details": _safe_error_details(e),
            }), 500

    # ── Phase 4: Full CV Optimizer (v2) ────────────────────────────────────
    @app.route("/api/v3/cv-optimizer", methods=["POST"])
    @jwt_required()
    @limiter.limit("10 per minute", key_func=_rate_limit_key_user)
    def cv_optimizer_v3():
        """
        POST /api/v3/cv-optimizer
        Phase 4 v3: Full CV optimization against a specific job description.
        Returns ATS scores, keyword analysis, rewritten sections, recruiter feedback.
        """
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            data = request.get_json(silent=True) or {}
            job_title = _require_json_field(data, "job_title", MAX_JOB_TITLE_LENGTH)
            job_description = _require_json_field(data, "job_description", MAX_JOB_DESC_LENGTH)

            cv_text, _ = _get_user_cv_text_and_skills(user)
            if not cv_text:
                return jsonify({"error": "No CV found. Please upload a CV first."}), 400

            result = optimize_cv(
                cv_text=cv_text,
                job_title=job_title,
                job_description=job_description,
            )

            if result.get("success"):
                return jsonify({
                    "success": True,
                    "optimization": result["data"],
                    "source": result.get("source"),
                    "model": result.get("model"),
                }), 200

            return jsonify({
                "success": False,
                "error": "CV optimization failed",
                "details": result.get("data", {}),
            }), 503

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] CV optimizer v3 endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to optimize CV",
                "details": _safe_error_details(e),
            }), 500

    # ── Phase 5: Interview Copilot ───────────────────────────────────────────
    @app.route("/interview-copilot", methods=["POST"])
    @jwt_required()
    @limiter.limit("10 per minute", key_func=_rate_limit_key_user)
    def interview_copilot():
        """
        POST /interview-copilot
        Phase 5: Generate personalized interview preparation.
        """
        try:
            data = request.get_json(silent=True) or {}
            job_title = _require_json_field(data, "job_title", MAX_JOB_TITLE_LENGTH)
            job_description = _require_json_field(data, "job_description", MAX_JOB_DESC_LENGTH)

            job_company = _sanitize_string(data.get("job_company", ""), 200)
            job_location = _sanitize_string(data.get("job_location", ""), 200)
            experience_level = _sanitize_string(data.get("experience_level", ""), 50)
            cv_text_input = _sanitize_string(data.get("cv_text", ""), MAX_CV_TEXT_LENGTH)

            # Build cv_data
            if cv_text_input:
                skills = extract_skills(cv_text_input)
                cv_data = {
                    "extracted_info": {
                        "full_name": "", "latest_job_title": "", "current_company": "",
                        "location": "", "years_experience": "", "education": "",
                        "certifications": [],
                    },
                    "extracted_skills": skills,
                    "cleaned_text": cv_text_input[:2000],
                }
            else:
                # Enrich from user profile
                user_id = get_jwt_identity()
                user = _get_user_or_404(user_id)
                cv_data = {
                    "extracted_info": {
                        "full_name": user.name or "",
                        "latest_job_title": user.title or "",
                        "current_company": user.company or "",
                        "location": user.location or "",
                        "years_experience": "", "education": "", "certifications": [],
                    },
                    "extracted_skills": {"technical": [], "soft": []},
                    "cleaned_text": "",
                }

            result = generate_interview_prep(
                cv_data=cv_data,
                job_title=job_title,
                job_description=job_description,
                job_company=job_company,
                job_location=job_location,
                experience_level=experience_level,
            )

            return jsonify({"success": True, "interview_prep": result}), 200

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] Interview copilot endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Interview copilot failed",
                "details": _safe_error_details(e),
            }), 500

    # ── Phase 6: Career Dashboard ────────────────────────────────────────────
    @app.route("/career-dashboard", methods=["POST"])
    @jwt_required()
    @limiter.limit("10 per minute", key_func=_rate_limit_key_user)
    def career_dashboard():
        """
        POST /career-dashboard
        Phase 6: Generate personalized career dashboard analysis.
        """
        try:
            data = request.get_json(silent=True) or {}
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            cv_text_input = _sanitize_string(data.get("cv_text", ""), MAX_CV_TEXT_LENGTH)

            # Validate numeric fields
            job_match_score = _validate_integer(
                data.get("job_match_score"),
                field_name="job_match_score",
                min_value=0,
                max_value=100,
                default=0,
            )

            if cv_text_input:
                skills = extract_skills(cv_text_input)
                cv_data = {
                    "extracted_info": {
                        "full_name": user.name,
                        "latest_job_title": user.title or "",
                        "current_company": user.company or "",
                        "location": user.location or "",
                        "years_experience": "", "education": "", "certifications": [],
                    },
                    "extracted_skills": skills,
                    "cleaned_text": cv_text_input[:2000],
                }
            else:
                cv_data = {
                    "extracted_info": {
                        "full_name": user.name,
                        "latest_job_title": user.title or "",
                        "current_company": user.company or "",
                        "location": user.location or "",
                        "years_experience": "", "education": "", "certifications": [],
                    },
                    "extracted_skills": {"technical": [], "soft": []},
                    "cleaned_text": "",
                }

            user_profile = {
                "name": user.name,
                "title": user.title,
                "company": user.company,
                "location": user.location,
            }

            result = generate_career_dashboard(
                cv_data=cv_data,
                user_profile=user_profile,
                job_match_score=job_match_score,
                top_matched_role=_sanitize_string(data.get("top_matched_role", ""), 200),
                skills_gap=_sanitize_string(data.get("skills_gap", ""), 1000),
                market_demand=_sanitize_string(data.get("market_demand", ""), 1000),
                analytics_summary=_sanitize_string(data.get("analytics_summary", ""), 2000),
            )

            return jsonify({"success": True, "career_dashboard": result}), 200

        except BadRequest as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            logger.exception("[req:%s] Career dashboard endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Career dashboard failed",
                "details": _safe_error_details(e),
            }), 500

    # ── Saved Jobs ───────────────────────────────────────────────────────────
    @app.route("/saved-jobs", methods=["GET", "POST", "DELETE"])
    @jwt_required()
    @limiter.limit("30 per minute", key_func=_rate_limit_key_user)
    def saved_jobs():
        """GET/POST/DELETE /saved-jobs — Manage user's saved job list."""
        user_id = get_jwt_identity()
        user = _get_user_or_404(user_id)

        def _get_saved_jobs() -> List[Dict]:
            if not user.cv_data:
                return []
            try:
                cv_data = json.loads(user.cv_data)
                return cv_data.get("saved_jobs", [])
            except (json.JSONDecodeError, AttributeError):
                return []

        def _set_saved_jobs(jobs: List[Dict]):
            if user.cv_data:
                try:
                    cv_data = json.loads(user.cv_data)
                except (json.JSONDecodeError, AttributeError):
                    cv_data = {}
            else:
                cv_data = {}
            cv_data["saved_jobs"] = jobs
            user.cv_data = json.dumps(cv_data)
            db.session.commit()

        if request.method == "GET":
            return jsonify({"saved_jobs": _get_saved_jobs()}), 200

        elif request.method == "POST":
            data = request.get_json(silent=True) or {}
            job = data.get("job")
            if not job:
                return jsonify({"error": "job data is required"}), 400

            current_saved = _get_saved_jobs()
            if user.subscription_tier != "premium" and len(current_saved) >= Config.DEMO_FREE_FEATURES.get("maxJobSaves", 10):
                return jsonify({
                    "error": "Save limit reached. Upgrade to Demo Premium for unlimited saves.",
                    "limit_reached": True,
                }), 403

            current_saved.append(job)
            _set_saved_jobs(current_saved)
            return jsonify({"message": "Job saved", "saved_jobs": current_saved}), 201

        elif request.method == "DELETE":
            data = request.get_json(silent=True) or {}
            job_id = data.get("job_id")
            if not job_id:
                return jsonify({"error": "job_id is required"}), 400

            current_saved = _get_saved_jobs()
            filtered = [
                j for j in current_saved
                if j.get("id") != job_id and j.get("job_id") != job_id
            ]
            if len(filtered) == len(current_saved):
                return jsonify({"error": "Job not found"}), 404

            _set_saved_jobs(filtered)
            return jsonify({"message": "Job removed", "saved_jobs": filtered}), 200

        return jsonify({"error": "Method not allowed"}), 405

    # ── AI Profile ───────────────────────────────────────────────────────────
    @app.route("/ai_profile", methods=["GET"])
    @jwt_required()
    @limiter.limit("60 per minute", key_func=_rate_limit_key_user)
    def get_ai_profile():
        """GET /ai_profile — Retrieve the user's AI-extracted profile."""
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            ai_profile = AIProfile.query.filter_by(user_id=user.id).first()
            if ai_profile:
                return jsonify({"ai_profile": ai_profile.to_dict()}), 200

            # Fallback: return structured data from legacy cv_data if available
            if user.cv_data:
                try:
                    cv_data = json.loads(user.cv_data)
                    return jsonify({
                        "ai_profile": {
                            "full_name": user.name,
                            "current_role": user.title,
                            "location": user.location,
                            "raw_text": cv_data.get("raw_text", ""),
                            "technical_skills": cv_data.get("extracted_skills", {}).get("technical", []),
                            "soft_skills": cv_data.get("extracted_skills", {}).get("soft", []),
                        }
                    }), 200
                except (json.JSONDecodeError, AttributeError):
                    pass

            return jsonify({"ai_profile": None, "message": "No AI profile found. Upload a CV first."}), 200

        except Exception as e:
            logger.exception("[req:%s] AI profile endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to retrieve AI profile",
                "details": _safe_error_details(e),
            }), 500

    # ── Job Links (Demo) ───────────────────────────────────────────────────
    @app.route("/get_job_links", methods=["GET"])
    @jwt_required()
    @limiter.limit("60 per minute", key_func=_rate_limit_key_user)
    def get_job_links():
        """GET /get_job_links — Return demo job links for the user."""
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            # Return demo job links based on user's title/location
            demo_links = [
                {
                    "id": "demo-1",
                    "title": f"Senior {user.title or 'Software Engineer'}",
                    "company": "TechCorp Inc.",
                    "location": user.location or "Remote",
                    "url": "https://example.com/jobs/1",
                    "source": "demo"
                },
                {
                    "id": "demo-2", 
                    "title": f"Lead {user.title or 'Developer'}",
                    "company": "InnovateTech",
                    "location": user.location or "Remote",
                    "url": "https://example.com/jobs/2",
                    "source": "demo"
                }
            ]
            return jsonify({"job_links": demo_links}), 200

        except Exception as e:
            logger.exception("[req:%s] Job links endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to retrieve job links",
                "details": _safe_error_details(e),
            }), 500

    # ── Job Details ──────────────────────────────────────────────────────────
    @app.route("/job/<string:job_id>", methods=["GET"])
    @jwt_required()
    @limiter.limit("60 per minute", key_func=_rate_limit_key_user)
    def get_job_details(job_id):
        """GET /job/<job_id> — Retrieve details for a specific job."""
        try:
            user_id = get_jwt_identity()
            user = _get_user_or_404(user_id)

            # For demo purposes, return a mock job detail
            demo_job = {
                "id": job_id,
                "title": "Senior Software Engineer",
                "company": "TechCorp Inc.",
                "location": user.location or "Remote",
                "description": "We are looking for an experienced software engineer to join our team...",
                "requirements": ["5+ years experience", "Python", "React", "Cloud platforms"],
                "salary_range": "$120k - $180k",
                "employment_type": "Full-time",
                "posted_at": datetime.utcnow().isoformat(),
                "url": f"https://example.com/jobs/{job_id}",
                "source": "demo"
            }
            return jsonify({"job": demo_job}), 200

        except Exception as e:
            logger.exception("[req:%s] Job details endpoint failed", getattr(g, "request_id", "—"))
            return jsonify({
                "error": "Failed to retrieve job details",
                "details": _safe_error_details(e),
            }), 500

    # ── Graceful Shutdown ──────────────────────────────────────────────────
    def _signal_handler(signum, frame):
        logger.info("Received signal %s. Shutting down gracefully...", signum)
        sys.exit(0)

    signal.signal(signal.SIGTERM, _signal_handler)
    signal.signal(signal.SIGINT, _signal_handler)

    logger.info("Flask application factory completed. All endpoints registered.")
    return app


# ── Entry Point ────────────────────────────────────────────────────────────────
app = create_app()

if __name__ == "__main__":
    # Development only. Production should use gunicorn/uwsgi.
    app.run(debug=app.config.get("DEBUG", True), host="0.0.0.0", port=5000)