"""
AI Career Intelligence API Routes
Dedicated endpoint for AI Career Intelligence with proper validation,
consistent responses, and exception handling.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User
from services.ai_career_intelligence import (
    get_career_intelligence_service,
    generate_career_intelligence,
    quick_match_score
)

logger = logging.getLogger(__name__)

ai_career_bp = Blueprint('ai_career_intelligence', __name__, url_prefix='/api/v1/ai-career')


def _get_cors_headers():
    """Get CORS headers from app config if available."""
    from flask import current_app
    origin = request.headers.get('Origin', '')
    allowed_origins = current_app.config.get('CORS_ORIGINS', ['http://localhost:3000'])
    headers = {}
    if origin in allowed_origins:
        headers['Access-Control-Allow-Origin'] = origin
        headers['Access-Control-Allow-Credentials'] = 'true'
    return headers


def _success_response(data, status_code=200):
    """Standardized success response format."""
    response = jsonify({
        "success": True,
        "data": data
    })
    response.status_code = status_code
    for key, value in _get_cors_headers().items():
        response.headers[key] = value
    return response


def _error_response(message, status_code=400, details=None):
    """Standardized error response format."""
    payload = {
        "success": False,
        "error": message
    }
    if details:
        payload["details"] = details
    response = jsonify(payload)
    response.status_code = status_code
    for key, value in _get_cors_headers().items():
        response.headers[key] = value
    return response


@ai_career_bp.route('/intelligence', methods=['POST', 'OPTIONS'])
@jwt_required()
def career_intelligence():
    """
    POST /api/v1/ai-career/intelligence
    
    Generate comprehensive AI Career Intelligence for a candidate-job pairing.
    
    Request Body:
        - job_title (str, required): Title of the job
        - job_description (str, required): Full job description
        - company_name (str, optional): Company name
        - industry (str, optional): Industry sector
        - user_skills (list[str], optional): Pre-extracted user skills
        - cv_text (str, optional): Explicit CV text override (uses stored CV if omitted)
    
    Returns:
        Structured career intelligence data with match analysis, skill mapping,
        strategic insights, and application strategy.
    """
    if request.method == 'OPTIONS':
        response = jsonify({})
        for key, value in _get_cors_headers().items():
            response.headers[key] = value
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 204
    
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return _error_response('User not found', 404)
        
        data = request.get_json(silent=True) or {}
        
        # Validate required fields
        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not job_title:
            return _error_response('job_title is required', 400)
        if not job_description:
            return _error_response('job_description is required', 400)
        
        # Get CV text: use override or fetch from user profile
        cv_text = data.get('cv_text', '').strip()
        if not cv_text and user.cv_data:
            try:
                import json
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data
        
        if not cv_text:
            return _error_response(
                'No CV data available. Please upload a CV first or provide cv_text.',
                400
            )
        
        # Extract skills from user profile if not provided
        user_skills = data.get('user_skills')
        if not user_skills and user.cv_data:
            try:
                import json
                cv_data = json.loads(user.cv_data)
                user_skills = cv_data.get('extracted_skills', [])
            except (json.JSONDecodeError, AttributeError):
                user_skills = None
        
        # Generate intelligence
        result = generate_career_intelligence(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            company_name=data.get('company_name'),
            industry=data.get('industry'),
            user_skills=user_skills
        )
        
        if result.get('success'):
            return _success_response(result['data'])
        else:
            # Return degraded response with 503 if service unavailable
            status = 503 if not result.get('data', {}).get('serviceAvailable', True) else 500
            return _error_response(
                'AI analysis service temporarily unavailable',
                status,
                details=result.get('data', {})
            )
            
    except Exception as e:
        logger.exception("Unhandled exception in career_intelligence endpoint")
        return _error_response('Internal server error', 500, details=str(e) if request.app.debug else None)


@ai_career_bp.route('/quick-match', methods=['POST', 'OPTIONS'])
@jwt_required()
def quick_match():
    """
    POST /api/v1/ai-career/quick-match
    
    Lightweight quick match scoring endpoint.
    Lower latency, reduced token usage for rapid feedback.
    """
    if request.method == 'OPTIONS':
        response = jsonify({})
        for key, value in _get_cors_headers().items():
            response.headers[key] = value
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response, 204
    
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return _error_response('User not found', 404)
        
        data = request.get_json(silent=True) or {}
        
        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not job_title or not job_description:
            return _error_response('job_title and job_description are required', 400)
        
        # Get CV text
        cv_text = data.get('cv_text', '').strip()
        if not cv_text and user.cv_data:
            try:
                import json
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data
        
        if not cv_text:
            return _error_response('No CV data available', 400)
        
        result = quick_match_score(cv_text, job_title, job_description)
        
        if result.get('success'):
            return _success_response(result['data'])
        return _error_response(
            'Quick match analysis failed',
            503,
            details=result.get('error')
        )
        
    except Exception as e:
        logger.exception("Unhandled exception in quick_match endpoint")
        return _error_response('Internal server error', 500, details=str(e) if request.app.debug else None)


@ai_career_bp.route('/health', methods=['GET'])
def health_check():
    """
    GET /api/v1/ai-career/health
    
    Health check for AI Career Intelligence service.
    """
    from clients.gemini_client import get_gemini_client
    
    try:
        client = get_gemini_client()
        health = client.health_check()
        return _success_response({
            'service': 'ai_career_intelligence',
            'gemini_api': health
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return _error_response('Service health check failed', 503, details=str(e))