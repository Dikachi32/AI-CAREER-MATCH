from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

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
    
    # Subscription fields (demo mode)
    subscription_tier = db.Column(db.String(20), default='free')  # 'free' | 'premium'
    subscription_status = db.Column(db.String(20), default='active')
    subscription_expires_at = db.Column(db.DateTime, nullable=True)
    
    # CV data persistence
    cv_data = db.Column(db.Text, nullable=True)  # JSON string of last CV analysis
    cv_uploaded_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'location': self.location,
            'title': self.title,
            'company': self.company,
            'subscription_tier': self.subscription_tier,
            'subscription_status': self.subscription_status,
            'subscription_expires_at': self.subscription_expires_at.isoformat() if self.subscription_expires_at else None,
            'has_cv': bool(self.cv_data),
            'date_joined': self.created_at.isoformat() if self.created_at else None,
            'last_updated': self.updated_at.isoformat() if self.updated_at else None
        }