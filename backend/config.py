import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-dev-secret-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}
    
    EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
    JOBS_JSON_PATH = os.path.join(basedir, 'data', 'jobs.json')
    
    # JSearch API credentials from .env
    JSEARCH_API_KEY = os.environ.get('JSEARCH_API_KEY')
    JSEARCH_API_HOST = os.environ.get('JSEARCH_API_HOST', 'jsearch.p.rapidapi.com')
    
    # Gemini API configuration
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash ')
    GEMINI_BASE_URL = os.environ.get('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/models')
    GEMINI_TIMEOUT = int(os.environ.get('GEMINI_TIMEOUT', '30'))
    GEMINI_MAX_RETRIES = int(os.environ.get('GEMINI_MAX_RETRIES', '3'))
    GEMINI_RETRY_DELAY = float(os.environ.get('GEMINI_RETRY_DELAY', '1.0'))
    GEMINI_RETRY_BACKOFF = float(os.environ.get('GEMINI_RETRY_BACKOFF', '2.0'))
    
    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,https://localhost:3000').split(',')
    
    # Demo subscription defaults
    DEMO_PREMIUM_FEATURES = {
        'canOptimizeCV': True,
        'canDownloadPDF': True,
        'canDownloadDOCX': True,
        'canAccessAdvancedATS': True,
        'maxCVUploads': 999,
        'maxJobSaves': 999
    }
    
    DEMO_FREE_FEATURES = {
        'canOptimizeCV': False,
        'canDownloadPDF': False,
        'canDownloadDOCX': False,
        'canAccessAdvancedATS': False,
        'maxCVUploads': 3,
        'maxJobSaves': 10
    }