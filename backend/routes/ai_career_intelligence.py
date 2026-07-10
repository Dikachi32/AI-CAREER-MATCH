"""
Phase 2 AI Career Intelligence API Routes
============================================

Comprehensive career intelligence engine endpoints.
Extends Phase 1 with full analysis capabilities.

CORS is handled globally by the Application Factory (app.py).
This module MUST NOT inject CORS headers manually.

Blueprints exported:
    ai_career_v2_bp   — Phase 2 V2 routes under /api/v2/ai-career
"""

import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import BadRequest

from models import db, User, AIProfile
from services.ai_career_intelligence_engine import (
    get_career_intelligence_engine,
    generate_full_career_intelligence,
    generate_quick_career_insight,
)

logger = logging.getLogger(__name__)

# ── Blueprints ─────────────────────────────────────────────────────────────
ai_career_v2_bp = Blueprint(
    "ai_career_intelligence_v2",
    __name__,
    url_prefix="/api/v2/ai-career",
)


# ── Validation Helpers (local to avoid circular imports) ────────────────────

def _sanitize_string(value, max_length=500):
    """Coerce to string, strip whitespace, truncate."""
    if value is None:
        return ""
    s = str(value).strip()
    return s[:max_length]


def _require_field(data, field, max_length=500):
    """Extract and validate a required string field. Raises BadRequest if missing/empty."""
    if not isinstance(data, dict):
        raise BadRequest("Request body must be a JSON object.")
    val = _sanitize_string(data.get(field, ""), max_length)
    if not val:
        raise BadRequest(f"`{field}` is required and cannot be empty.")
    return val


def _safe_error_details(exc):
    """Return exception details ONLY in debug mode. Prevents info leakage."""
    return str(exc) if current_app.debug else None


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_user_cv_data(user: User) -> tuple:
    """
    Extract CV text and skills from user profile.

    Returns:
        (cv_text: str, user_skills: list, ai_profile: AIProfile|None)
    """
    cv_text = ""
    user_skills = []
    ai_profile = None

    # Phase 2: AIProfile first (enhanced structured data)
    ai_profile = AIProfile.query.filter_by(user_id=user.id).first()
    if ai_profile and ai_profile.raw_text:
        cv_text = ai_profile.raw_text

    # Fallback: legacy cv_data blob
    if not cv_text and user.cv_data:
        try:
            import json
            cv_data = json.loads(user.cv_data)
            cv_text = cv_data.get("raw_text", "") or cv_data.get("cleaned_text", "")
            user_skills = cv_data.get("extracted_skills", [])
        except (json.JSONDecodeError, AttributeError):
            cv_text = user.cv_data

    # Extract skills from AIProfile if still missing
    if ai_profile and not user_skills:
        user_skills = ai_profile.get_json_field("technical_skills")

    return cv_text, user_skills, ai_profile


# ── Endpoints ──────────────────────────────────────────────────────────────

@ai_career_v2_bp.route("/intelligence", methods=["POST"])
@jwt_required()
def career_intelligence_v2():
    """
    POST /api/v2/ai-career/intelligence

    Generate comprehensive Phase 2 AI Career Intelligence.
    Uses AIProfile data when available for enhanced analysis.

    Request Body:
        - job_title (str, required)
        - job_description (str, required)
        - company_name (str, optional)
        - industry (str, optional)
        - cv_text (str, optional) — overrides stored CV
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        data = request.get_json(silent=True) or {}

        job_title = _require_field(data, "job_title", max_length=200)
        job_description = _require_field(data, "job_description", max_length=30_000)

        # Get user CV data (prioritizes AIProfile)
        cv_text, user_skills, ai_profile = _get_user_cv_data(user)

        # Allow CV text override from request
        if data.get("cv_text", "").strip():
            cv_text = _sanitize_string(data["cv_text"], max_length=50_000)

        if not cv_text:
            return jsonify({
                "success": False,
                "error": "No CV data available. Please upload a CV first or provide cv_text.",
            }), 400

        # Generate Phase 2 intelligence
        result = generate_full_career_intelligence(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            company_name=_sanitize_string(data.get("company_name"), 200) or None,
            industry=_sanitize_string(data.get("industry"), 100) or None,
            ai_profile=ai_profile,
            user_skills=user_skills,
        )

        if result.get("success"):
            return jsonify({"success": True, "data": result["data"]}), 200

        status = 503 if not result.get("data", {}).get("serviceAvailable", True) else 500
        return jsonify({
            "success": False,
            "error": "AI analysis service temporarily unavailable",
            "details": result.get("data", {}),
        }), status

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.exception("Unhandled exception in career_intelligence_v2")
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "details": _safe_error_details(e),
        }), 500


@ai_career_v2_bp.route("/quick-insight", methods=["POST"])
@jwt_required()
def quick_insight_v2():
    """
    POST /api/v2/ai-career/quick-insight

    Lightweight quick insight for rapid feedback.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        data = request.get_json(silent=True) or {}

        job_title = _require_field(data, "job_title", max_length=200)
        job_description = _require_field(data, "job_description", max_length=30_000)

        cv_text, _, ai_profile = _get_user_cv_data(user)

        if data.get("cv_text", "").strip():
            cv_text = _sanitize_string(data["cv_text"], max_length=50_000)

        if not cv_text:
            return jsonify({"success": False, "error": "No CV data available"}), 400

        result = generate_quick_career_insight(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            ai_profile=ai_profile,
        )

        if result.get("success"):
            return jsonify({"success": True, "data": result["data"]}), 200

        return jsonify({
            "success": False,
            "error": "Quick insight failed",
            "details": result.get("error"),
        }), 503

    except BadRequest as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        logger.exception("Unhandled exception in quick_insight_v2")
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "details": _safe_error_details(e),
        }), 500


@ai_career_v2_bp.route("/health", methods=["GET"])
def health_check_v2():
    """
    GET /api/v2/ai-career/health

    Health check for Phase 2 AI Career Intelligence engine.
    """
    from clients.gemini_client import get_gemini_client

    try:
        client = get_gemini_client()
        health = client.health_check()
        return jsonify({
            "success": True,
            "data": {
                "service": "ai_career_intelligence_v2",
                "gemini_api": health,
                "phase": 2,
            },
        }), 200
    except Exception as e:
        logger.error("Phase 2 health check failed: %s", str(e))
        return jsonify({
            "success": False,
            "error": "Service health check failed",
            "details": _safe_error_details(e),
        }), 503