"""
backend/auth.py — Authentication Blueprint
============================================
Phase 7D — Security, Validation & Error Handling Hardening

Handles user registration, login, and profile management.
All inputs are sanitized and length-limited.
DB operations are wrapped in try/except with rollback.
Sensitive exceptions are never exposed to API consumers.

Endpoints:
    POST   /auth/register
    POST   /auth/login
    GET    /auth/profile
    PUT    /auth/profile
"""

import logging
import re
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from werkzeug.exceptions import BadRequest

from models import db, User

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
bcrypt = Bcrypt()

# ── Constants ──────────────────────────────────────────────────────────────
MAX_EMAIL_LENGTH = 254          # RFC 5321
MAX_PASSWORD_LENGTH = 128       # sensible upper bound
MAX_NAME_LENGTH = 100           # display name
MIN_PASSWORD_LENGTH = 6         # minimum viable password length

# Simple e-mail regex — not RFC-compliant but catches obvious garbage
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", re.IGNORECASE)


# ── Validation Helpers ─────────────────────────────────────────────────────

def _sanitize_string(value, max_length=500):
    """Coerce to string, strip whitespace, truncate."""
    if value is None:
        return ""
    s = str(value).strip()
    return s[:max_length]


def _safe_error_details(exc):
    """Return exception details ONLY in debug mode. Prevents info leakage."""
    return str(exc) if current_app.debug else None


# ── Endpoints ──────────────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    POST /auth/register

    Register a new user account.
    """
    try:
        data = request.get_json(silent=True) or {}

        # ── Input extraction & sanitization ────────────────────────────────
        email = _sanitize_string(data.get("email"), MAX_EMAIL_LENGTH).lower()
        password = _sanitize_string(data.get("password"), MAX_PASSWORD_LENGTH)
        name = _sanitize_string(data.get("name", "User"), MAX_NAME_LENGTH)

        # ── Validation ─────────────────────────────────────────────────────
        if not email:
            return jsonify({"error": "Email is required."}), 400
        if not _EMAIL_RE.match(email):
            return jsonify({"error": "Invalid email format."}), 400
        if not password:
            return jsonify({"error": "Password is required."}), 400
        if len(password) < MIN_PASSWORD_LENGTH:
            return jsonify({
                "error": f"Password must be at least {MIN_PASSWORD_LENGTH} characters.",
            }), 400
        if not name:
            name = "User"

        # ── Duplicate check ────────────────────────────────────────────────
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "User already exists."}), 409

        # ── Create user ──────────────────────────────────────────────────────
        hashed = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User(email=email, password=hashed, name=name)
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))

        logger.info("User registered: id=%s email=%s", user.id, email)
        return jsonify({
            "message": "User created",
            "token": token,
            "user": user.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.exception("Registration failed")
        return jsonify({
            "error": "Registration failed. Please try again.",
            "details": _safe_error_details(e),
        }), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    POST /auth/login

    Authenticate an existing user and return a JWT.
    """
    try:
        data = request.get_json(silent=True) or {}

        email = _sanitize_string(data.get("email"), MAX_EMAIL_LENGTH).lower()
        password = _sanitize_string(data.get("password"), MAX_PASSWORD_LENGTH)

        if not email or not password:
            return jsonify({"error": "Email and password are required."}), 400

        user = User.query.filter_by(email=email).first()

        # Constant-time comparison is handled by bcrypt internally.
        if not user or not bcrypt.check_password_hash(user.password, password):
            logger.warning("Failed login attempt for email=%s", email)
            return jsonify({"error": "Invalid credentials."}), 401

        token = create_access_token(identity=str(user.id))

        logger.info("User logged in: id=%s email=%s", user.id, email)
        return jsonify({
            "token": token,
            "user": user.to_dict(),
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.exception("Login failed")
        return jsonify({
            "error": "Login failed. Please try again.",
            "details": _safe_error_details(e),
        }), 500


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """
    GET /auth/profile

    Retrieve the authenticated user's profile.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found."}), 404
        return jsonify({"user": user.to_dict()}), 200

    except Exception as e:
        logger.exception("Get profile failed")
        return jsonify({
            "error": "Failed to retrieve profile.",
            "details": _safe_error_details(e),
        }), 500


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """
    PUT /auth/profile

    Update the authenticated user's profile fields.
    Only whitelisted fields are accepted.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found."}), 404

        data = request.get_json(silent=True) or {}

        # Whitelist of updatable fields with sanitization
        _ALLOWED_PROFILE_FIELDS = {
            "name": ("name", MAX_NAME_LENGTH),
            "location": ("location", 200),
            "title": ("title", 200),
            "company": ("company", 200),
            "avatar_url": ("avatar_url", 2048),
        }

        updated = []
        for key, (attr, max_len) in _ALLOWED_PROFILE_FIELDS.items():
            if key in data:
                val = _sanitize_string(data[key], max_len)
                if val or data[key] is not None:  # allow explicit empty string
                    setattr(user, attr, val)
                    updated.append(key)

        if updated:
            db.session.commit()
            logger.info("Profile updated for user_id=%s fields=%s", user_id, updated)

        return jsonify({"user": user.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception("Update profile failed")
        return jsonify({
            "error": "Failed to update profile.",
            "details": _safe_error_details(e),
        }), 500