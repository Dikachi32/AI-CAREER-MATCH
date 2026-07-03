import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-dev-secret'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}
    EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
    JOBS_JSON_PATH = os.path.join(basedir, 'data', 'jobs.json')
    
    # JSearch API credentials from .env
    JSEARCH_API_KEY = os.environ.get('JSEARCH_API_KEY')
    JSEARCH_API_HOST = os.environ.get('JSEARCH_API_HOST', 'jsearch.p.rapidapi.com')