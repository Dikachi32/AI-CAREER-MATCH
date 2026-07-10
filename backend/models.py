from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False, default="User")
    avatar_url = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(100), nullable=True)
    title = db.Column(db.String(100), nullable=True)
    company = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Subscription fields (required by app.py)
    subscription_tier = db.Column(db.String(20), nullable=False, default="free")
    subscription_status = db.Column(db.String(20), nullable=False, default="active")
    subscription_expires_at = db.Column(db.DateTime, nullable=True)

    # CV data fields (required by app.py)
    cv_data = db.Column(db.Text, nullable=True)
    cv_uploaded_at = db.Column(db.DateTime, nullable=True)

    # Relationship to AI Profile
    ai_profile = db.relationship('AIProfile', backref='user', uselist=False, lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'location': self.location,
            'title': self.title,
            'company': self.company,
            'date_joined': self.created_at.isoformat() if self.created_at else None,
            'subscription_tier': self.subscription_tier,
            'subscription_status': self.subscription_status,
            'subscription_expires_at': self.subscription_expires_at.isoformat() if self.subscription_expires_at else None,
            'cv_uploaded_at': self.cv_uploaded_at.isoformat() if self.cv_uploaded_at else None,
        }


class AIProfile(db.Model):
    """
    Stores the structured AI-extracted profile from Google Gemini.
    Generated once per CV upload. Reused across all features.
    """
    __tablename__ = 'ai_profile'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Core Identity
    full_name = db.Column(db.String(200), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    linkedin = db.Column(db.String(255), nullable=True)
    github = db.Column(db.String(255), nullable=True)
    portfolio = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(200), nullable=True)

    # Professional Summary
    professional_summary = db.Column(db.Text, nullable=True)
    current_role = db.Column(db.String(200), nullable=True)
    career_level = db.Column(db.String(50), nullable=True)
    years_of_experience = db.Column(db.Float, nullable=True)

    # Structured Data (stored as JSON for flexibility)
    education = db.Column(db.Text, default='[]')  # List of dicts
    certifications = db.Column(db.Text, default='[]')  # List of strings
    projects = db.Column(db.Text, default='[]')  # List of dicts
    awards = db.Column(db.Text, default='[]')  # List of strings
    languages = db.Column(db.Text, default='[]')  # List of strings

    # Skills (stored as JSON arrays)
    technical_skills = db.Column(db.Text, default='[]')
    soft_skills = db.Column(db.Text, default='[]')
    leadership_skills = db.Column(db.Text, default='[]')
    frameworks = db.Column(db.Text, default='[]')
    libraries = db.Column(db.Text, default='[]')
    databases = db.Column(db.Text, default='[]')
    cloud_platforms = db.Column(db.Text, default='[]')
    devops_tools = db.Column(db.Text, default='[]')

    # Industry & Specialization
    industry = db.Column(db.String(100), nullable=True)
    specialization = db.Column(db.String(100), nullable=True)

    # Raw text backup (for fallback/reprocessing)
    raw_text = db.Column(db.Text, nullable=True)

    def set_json_field(self, field_name, value):
        """Safely serialize a Python object to JSON string."""
        if value is None:
            setattr(self, field_name, '[]')
        else:
            setattr(self, field_name, json.dumps(value))

    def get_json_field(self, field_name):
        """Safely deserialize a JSON string to Python object."""
        raw = getattr(self, field_name, '[]')
        if not raw:
            return []
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return []

    def to_dict(self):
        """Return the complete structured AI profile as a clean dictionary."""
        return {
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'linkedin': self.linkedin,
            'github': self.github,
            'portfolio': self.portfolio,
            'location': self.location,
            'professional_summary': self.professional_summary,
            'current_role': self.current_role,
            'career_level': self.career_level,
            'years_of_experience': self.years_of_experience,
            'education': self.get_json_field('education'),
            'certifications': self.get_json_field('certifications'),
            'projects': self.get_json_field('projects'),
            'awards': self.get_json_field('awards'),
            'languages': self.get_json_field('languages'),
            'technical_skills': self.get_json_field('technical_skills'),
            'soft_skills': self.get_json_field('soft_skills'),
            'leadership_skills': self.get_json_field('leadership_skills'),
            'frameworks': self.get_json_field('frameworks'),
            'libraries': self.get_json_field('libraries'),
            'databases': self.get_json_field('databases'),
            'cloud_platforms': self.get_json_field('cloud_platforms'),
            'devops_tools': self.get_json_field('devops_tools'),
            'industry': self.industry,
            'specialization': self.specialization,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def to_extracted_info_dict(self):
        """
        Backward-compatible mapping for legacy frontend expecting old 'extracted_info' structure.
        """
        return {
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'location': self.location,
            'years_experience': int(self.years_of_experience) if self.years_of_experience else None,
            'education': ', '.join([e.get('degree', '') for e in self.get_json_field('education')]) if self.get_json_field('education') else None,
            'latest_job_title': self.current_role,
            'current_company': None,  # Gemini extracts current_role; company often ambiguous
            'certifications': self.get_json_field('certifications')
        }

    def to_skills_dict(self):
        """
        Backward-compatible mapping for legacy skill structure.
        """
        return {
            'technical': self.get_json_field('technical_skills'),
            'soft': self.get_json_field('soft_skills')
        }