import os
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))


class Config:
    """
    Centralized application configuration.
    All environment variables are read here and exposed as typed class attributes.

    Security-related constants are centralized here for single-source-of-truth.
    """

    # ── Flask Core ───────────────────────────────────────────────────────────
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-dev-secret-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24)))
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')

    # ── Database ─────────────────────────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── File Uploads ─────────────────────────────────────────────────────────
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}

    # ── ML / Embeddings ──────────────────────────────────────────────────────
    EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
    JOBS_JSON_PATH = os.path.join(basedir, 'data', 'jobs.json')

    # ── JSearch API ──────────────────────────────────────────────────────────
    JSEARCH_API_KEY = os.environ.get('JSEARCH_API_KEY')
    JSEARCH_API_HOST = os.environ.get('JSEARCH_API_HOST', 'jsearch.p.rapidapi.com')

    # ── Gemini API Configuration ─────────────────────────────────────────────
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash').strip()
    GEMINI_BASE_URL = os.environ.get(
        'GEMINI_BASE_URL',
        'https://generativelanguage.googleapis.com/v1beta/models'
    )
    GEMINI_TIMEOUT = int(os.environ.get('GEMINI_TIMEOUT', '30'))
    GEMINI_MAX_RETRIES = int(os.environ.get('GEMINI_MAX_RETRIES', '3'))
    GEMINI_RETRY_DELAY = float(os.environ.get('GEMINI_RETRY_DELAY', '1.0'))
    GEMINI_RETRY_BACKOFF = float(os.environ.get('GEMINI_RETRY_BACKOFF', '2.0'))

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            'CORS_ORIGINS',
            'http://localhost:3000,https://localhost:3000'
        ).split(',')
        if origin.strip()
    ]

    # ── Rate Limiting ────────────────────────────────────────────────────────
    RATELIMIT_STORAGE_URI = os.environ.get('RATELIMIT_STORAGE_URI', 'memory://')
    RATELIMIT_STRATEGY = os.environ.get('RATELIMIT_STRATEGY', 'fixed-window')
    RATELIMIT_ENABLED = os.environ.get('RATELIMIT_ENABLED', 'true').lower() in ('true', '1', 'yes')
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '200 per hour')

    # ── Demo Subscription Tiers ──────────────────────────────────────────────
    DEMO_PREMIUM_FEATURES = {
        'canOptimizeCV': True,
        'canDownloadPDF': True,
        'canDownloadDOCX': True,
        'canAccessAdvancedATS': True,
        'maxCVUploads': 999,
        'maxJobSaves': 999,
    }

    DEMO_FREE_FEATURES = {
        'canOptimizeCV': False,
        'canDownloadPDF': False,
        'canDownloadDOCX': False,
        'canAccessAdvancedATS': False,
        'maxCVUploads': 3,
        'maxJobSaves': 10,
    }

    # ── Validation / Security Constants ──────────────────────────────────────
    MAX_JSON_PAYLOAD_SIZE = 2 * 1024 * 1024   # 2 MB
    MAX_CV_TEXT_LENGTH = 50_000               # characters
    MAX_JOB_DESC_LENGTH = 30_000              # characters
    MAX_JOB_TITLE_LENGTH = 200                # characters
    MAX_STRING_FIELD_LENGTH = 500             # generic string cap
    MAX_EMAIL_LENGTH = 254                    # RFC 5321
    MAX_PASSWORD_LENGTH = 128                 # sensible upper bound
    MAX_NAME_LENGTH = 100                     # display name
    MIN_PASSWORD_LENGTH = 6                   # minimum viable password