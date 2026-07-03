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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'avatar_url': self.avatar_url,
            'location': self.location,
            'title': self.title,
            'company': self.company,
            'date_joined': self.created_at.isoformat() if self.created_at else None
        }