"""
backend/wsgi.py — Production WSGI Entry Point
==============================================

Phase 7C — Production Entry Point

This module is the canonical entry point for production WSGI servers
such as Gunicorn, uWSGI, or mod_wsgi.  It imports the Application
Factory and exposes the standard ``application`` callable.

Usage with Gunicorn::

    gunicorn -w 4 -b 0.0.0.0:5000         --access-logfile -         --error-logfile -         --timeout 60         "wsgi:application"

Usage with uWSGI::

    uwsgi --http 0.0.0.0:5000         --wsgi-file wsgi.py         --callable application         --processes 4         --threads 2

Environment Variables (all optional):
    FLASK_ENV           development | production | testing
    FLASK_DEBUG         True | False
    DATABASE_URL        SQLAlchemy DB URI (defaults to SQLite)
    CORS_ORIGINS        Comma-separated list of allowed origins
    SECRET_KEY          Flask secret key
    JWT_SECRET_KEY      JWT signing key
    GEMINI_API_KEY      Gemini API key
    JSEARCH_API_KEY     JSearch API key
"""

import os
import logging
import sys

# ── Logging Setup ──────────────────────────────────────────────────────────
# Ensure logs go to stderr so they are captured by the WSGI server / container.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stderr,
)
logger = logging.getLogger("wsgi")

# ── Application Factory Import ─────────────────────────────────────────────
# We import from the package root.  The working directory for the WSGI server
# should be the ``backend/`` folder (or the project root with proper PYTHONPATH).
try:
    from app import create_app
except ImportError as exc:
    logger.critical(
        "Failed to import Application Factory. "
        "Ensure the working directory is the backend folder or PYTHONPATH is set. "
        "Original error: %s",
        exc,
    )
    raise

# ── Environment-Driven Config Selection ────────────────────────────────────
# Map FLASK_ENV to a config class.  Defaults to production-safe settings.
_env = os.environ.get("FLASK_ENV", "production").lower()

if _env == "development":
    from config import Config as _ConfigClass
elif _env == "testing":
    # If a TestConfig exists, use it; otherwise fall back to base Config.
    try:
        from config import TestConfig as _ConfigClass
    except ImportError:
        from config import Config as _ConfigClass
        logger.warning("TestConfig not found; falling back to base Config for testing.")
else:
    # Production (default)
    from config import Config as _ConfigClass

# ── Create Application Instance ────────────────────────────────────────────
# This is the callable that Gunicorn / uWSGI will invoke.
application = create_app(config_class=_ConfigClass)

# Also expose as ``app`` for convenience in some WSGI server configurations.
app = application

logger.info(
    "WSGI application created — env=%s, debug=%s, version=%s",
    _env,
    application.debug,
    application.config.get("VERSION", "unknown"),
)

# ── Optional: Pre-start Health Check ───────────────────────────────────────
# Verify DB connectivity before the first request to fail fast in orchestrated
# environments (Kubernetes, Docker Swarm, etc.).
if os.environ.get("WSGI_PRESTART_HEALTH_CHECK", "false").lower() in ("true", "1", "yes"):
    with application.app_context():
        try:
            from models import db
            db.session.execute(db.text("SELECT 1"))
            logger.info("Pre-start health check passed — database is reachable.")
        except Exception as exc:
            logger.critical("Pre-start health check FAILED — database unreachable: %s", exc)
            raise SystemExit(1) from exc