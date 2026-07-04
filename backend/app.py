import os
import traceback
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from config import Config
from preprocessing.cv_parser import parse_cv
from preprocessing.skill_extractor import extract_skills
from recommendation.embedding_matcher import JobMatcher
from recommendation.job_fetcher import fetch_real_jobs
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from models import db, User
from auth import auth_bp
from datetime import datetime
from services.ai_job_intelligence import analyze_job_intelligence, match_cv_to_job
from services.ai_skill_analytics import analyze_skills
from services.cv_optimizer import optimize_cv as cv_optimize

app = Flask(__name__)
app.config.from_object(Config)

# Secure CORS: allow specific origins with credentials
CORS(app, resources={
    r"/*": {
        "origins": Config.CORS_ORIGINS,
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
})

jwt = JWTManager(app)
db.init_app(app)
app.register_blueprint(auth_bp)

with app.app_context():
    db.create_all()

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
matcher = JobMatcher(model_name=Config.EMBEDDING_MODEL, jobs_json_path=Config.JOBS_JSON_PATH)

ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ========== ERROR HANDLERS ==========

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(RequestEntityTooLarge)
def too_large(error):
    return jsonify({'error': 'File too large. Max size is 16MB.'}), 413

# ========== JWT ERROR HANDLERS ==========

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token expired. Please log in again.'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid authentication token.', 'details': str(error)}), 422

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({'error': 'Authorization required. Please log in.'}), 401

@jwt.needs_fresh_token_loader
def token_not_fresh_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Fresh token required. Please log in again.'}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has been revoked. Please log in again.'}), 401

# ========== REQUEST LOGGING (dev only) ==========

@app.before_request
def log_request():
    if app.debug:
        print(f"\n>>> REQUEST: {request.method} {request.path}")
        print(f"  Content-Type: {request.content_type}")

# ========== HEALTH & STATS ==========

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'AI Career Recommendation API is running',
        'version': '2.1.0',
        'timestamp': datetime.utcnow().isoformat(),
        'environment': 'development' if app.debug else 'production'
    }), 200

@app.route('/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'jobs_analyzed': 50000,
        'cvs_processed': 10000,
        'matching_accuracy': 95,
        'partner_companies': 500,
        'active_users': 2500
    }), 200

# ========== DEMO SUBSCRIPTION ENDPOINTS ==========

@app.route('/subscription', methods=['GET'])
@jwt_required()
def get_subscription():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    features = Config.DEMO_PREMIUM_FEATURES if user.subscription_tier == 'premium' else Config.DEMO_FREE_FEATURES
    
    return jsonify({
        'tier': user.subscription_tier,
        'status': user.subscription_status,
        'expires_at': user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        'is_demo': True,
        'features': features
    }), 200

@app.route('/subscription/demo-toggle', methods=['POST'])
@jwt_required()
def toggle_demo_subscription():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json() or {}
    target_tier = data.get('tier', 'premium' if user.subscription_tier == 'free' else 'free')
    
    user.subscription_tier = target_tier
    user.subscription_status = 'active'
    
    if target_tier == 'premium':
        user.subscription_expires_at = datetime.utcnow()
    else:
        user.subscription_expires_at = None
    
    db.session.commit()
    
    features = Config.DEMO_PREMIUM_FEATURES if target_tier == 'premium' else Config.DEMO_FREE_FEATURES
    
    return jsonify({
        'message': f'Demo subscription changed to {target_tier}',
        'tier': target_tier,
        'features': features
    }), 200

# ========== CV UPLOAD ==========

@app.route('/upload_cv', methods=['POST'])
@jwt_required()
def upload_cv():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check upload limits for free users
        if user.subscription_tier != 'premium':
            upload_count = user.cv_uploaded_at or 0
            # Simple tracking: if they have cv_data, count it as 1 for demo
            has_cv = 1 if user.cv_data else 0
            if has_cv >= Config.DEMO_FREE_FEATURES['maxCVUploads']:
                return jsonify({
                    'error': 'Upload limit reached. Upgrade to Demo Premium for unlimited uploads.'
                }), 403

        if 'cv' in request.files:
            file = request.files['cv']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400

            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                file_type = filename.rsplit('.', 1)[1].lower()
                location = request.form.get('location', '').strip()

                try:
                    cv_data = parse_cv(file_path, file_type)
                    skills = extract_skills(cv_data['raw_text'])
                    info = cv_data['extracted_info']

                    # Update user profile
                    if info.get('full_name') and (not user.name or user.name == 'User'):
                        user.name = info['full_name']
                    if info.get('location'):
                        user.location = info['location']
                    elif location:
                        user.location = location
                    if info.get('latest_job_title'):
                        user.title = info['latest_job_title']
                    if info.get('current_company'):
                        user.company = info['current_company']

                    # Persist CV data
                    user.cv_data = json.dumps({
                        'extracted_info': info,
                        'extracted_skills': skills,
                        'cleaned_text': cv_data['cleaned_text'],
                        'raw_text': cv_data['raw_text'][:5000]  # Limit stored size
                    })
                    user.cv_uploaded_at = datetime.utcnow()
                    db.session.commit()

                    return jsonify({
                        'message': 'CV uploaded and processed successfully',
                        'extracted_skills': skills,
                        'extracted_info': info,
                        'cleaned_text': cv_data['cleaned_text'][:500] + '...',
                        'user': user.to_dict()
                    }), 200
                except Exception as e:
                    traceback.print_exc()
                    return jsonify({'error': f'Processing failed: {str(e)}'}), 500
            else:
                return jsonify({'error': 'File type not allowed. Only PDF and DOCX.'}), 400

        # Text paste fallback
        data = request.get_json(silent=True)
        if not data or 'cv_text' not in data:
            return jsonify({'error': 'No CV file or text provided'}), 400

        cv_text = data['cv_text']
        skills = extract_skills(cv_text)

        # Persist text CV
        user.cv_data = json.dumps({
            'extracted_info': {
                'full_name': None,
                'email': None,
                'phone': None,
                'location': data.get('location') or None,
                'years_experience': None,
                'education': None,
                'latest_job_title': None,
                'current_company': None,
                'certifications': []
            },
            'extracted_skills': skills,
            'cleaned_text': cv_text[:5000],
            'raw_text': cv_text[:5000]
        })
        user.cv_uploaded_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'CV text processed successfully',
            'extracted_skills': skills,
            'extracted_info': {
                'full_name': None,
                'email': None,
                'phone': None,
                'location': data.get('location') or None,
                'years_experience': None,
                'education': None,
                'latest_job_title': None,
                'current_company': None,
                'certifications': []
            },
            'cleaned_text': cv_text[:500] + '...',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ========== RECOMMENDATIONS ==========

@app.route('/recommend_jobs', methods=['POST'])
@jwt_required()
def recommend_jobs():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing request body'}), 400

        cv_text = data.get('cv_text', '').strip()
        location = data.get('location', '').strip()
        filters = data.get('filters', {})

        # Load from user if no cv_text provided
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not cv_text and user and user.cv_data:
            try:
                stored = json.loads(user.cv_data)
                cv_text = stored.get('cleaned_text', '') or stored.get('raw_text', '')
            except:
                pass

        skills_data = extract_skills(cv_text) if cv_text else {'technical': [], 'soft': []}
        user_skills = skills_data['technical']

        keyword = data.get('keyword', '').strip()
        if not keyword:
            cv_lower = cv_text.lower()
            title_patterns = [
                'senior software engineer', 'software engineer', 'full stack developer',
                'backend developer', 'frontend developer', 'devops engineer',
                'data scientist', 'data engineer', 'machine learning engineer',
                'cloud engineer', 'site reliability engineer', 'mobile developer',
                'web developer', 'python developer', 'react developer', 'java developer'
            ]
            detected_title = None
            for title in title_patterns:
                if title in cv_lower:
                    detected_title = title
                    break
            if detected_title:
                keyword = detected_title
            elif user_skills:
                keyword = f"{user_skills[0]} developer"
            else:
                keyword = 'software engineer'

        print(f"[Recommend] Keyword: '{keyword}' | Location: '{location}' | Skills: {user_skills[:5]}")

        real_jobs = fetch_real_jobs(keyword, location, num_pages=2)

        if not real_jobs:
            return jsonify({
                'recommendations': [],
                'summary': {
                    'total_jobs': 0,
                    'average_match': 0,
                    'top_career': 'N/A',
                    'highest_salary': 'N/A'
                }
            }), 200

        results = []
        for job in real_jobs:
            job_text = (job.get('description', '') + ' ' + job.get('title', '')).lower()
            matched_skills = [skill for skill in user_skills if skill.lower() in job_text]
            match_score = min(98, 25 + len(matched_skills) * 12) if matched_skills else 15

            if filters.get('remote') is True and not job.get('remote'):
                continue
            if filters.get('experience_level'):
                if filters['experience_level'].lower() not in job.get('experience_level', '').lower():
                    continue
            if filters.get('industry'):
                if filters['industry'].lower() not in job.get('industry', '').lower():
                    continue

            results.append({
                'job_id': job.get('job_id'),
                'title': job.get('title'),
                'company': job.get('company'),
                'location': job.get('location'),
                'description': job.get('description', '')[:400] + '...' if len(job.get('description', '')) > 400 else job.get('description', ''),
                'apply_link': job.get('apply_link'),
                'salary_range': job.get('salary_range', 'N/A'),
                'match_score': match_score,
                'remote': job.get('remote', False),
                'experience_level': job.get('experience_level', 'N/A'),
                'industry': job.get('industry', 'N/A')
            })

        results.sort(key=lambda x: x['match_score'], reverse=True)
        avg_match = sum(r['match_score'] for r in results) / len(results) if results else 0
        highest_salary = max([r['salary_range'] for r in results], default='N/A')

        return jsonify({
            'recommendations': results[:20],
            'summary': {
                'total_jobs': len(results),
                'average_match': round(avg_match, 1),
                'top_career': results[0]['title'] if results else 'N/A',
                'highest_salary': highest_salary
            }
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# ========== JOB LINKS ==========

@app.route('/get_job_links', methods=['GET'])
def get_job_links():
    query = request.args.get('query', 'software engineer')
    location = request.args.get('location', '')
    jobs = fetch_real_jobs(query, location, num_pages=1)
    job_links = [{
        'job_id': job['job_id'],
        'title': job['title'],
        'company': job['company'],
        'apply_link': job['apply_link']
    } for job in jobs[:10]]
    return jsonify(job_links), 200

# ========== ANALYTICS ==========

@app.route('/analytics', methods=['POST'])
@jwt_required()
def get_analytics():
    try:
        data = request.get_json()
        if not data or 'cv_text' not in data:
            return jsonify({'error': 'Missing cv_text'}), 400

        cv_text = data['cv_text']
        skills = extract_skills(cv_text)
        experience_years = data.get('experience_years')

        # Traditional analytics (preserved for existing charts)
        market_demand = {
            'python': 98, 'javascript': 95, 'react': 92, 'docker': 88,
            'aws': 90, 'kubernetes': 85, 'sql': 94, 'git': 96,
            'typescript': 89, 'node': 87, 'fastapi': 78, 'django': 82,
            'tensorflow': 75, 'system design': 80
        }

        skill_analysis = []
        for skill in skills['technical']:
            demand = market_demand.get(skill.lower(), 70)
            mentions = cv_text.lower().count(skill.lower())
            confidence = min(99, 70 + mentions * 5)

            skill_analysis.append({
                'name': skill,
                'level': 'Advanced' if mentions > 2 else 'Intermediate',
                'confidence': confidence,
                'market_demand': demand,
                'mentions': mentions
            })

        all_skills = set(s['name'].lower() for s in skill_analysis)
        recommendations = []
        if 'aws' not in all_skills:
            recommendations.append({'skill': 'AWS', 'reason': 'High demand in cloud-native roles', 'priority': 'High'})
        if 'kubernetes' not in all_skills:
            recommendations.append({'skill': 'Kubernetes', 'reason': 'Essential for DevOps and scaling', 'priority': 'High'})
        if 'system design' not in all_skills:
            recommendations.append({'skill': 'System Design', 'reason': 'Required for senior engineering roles', 'priority': 'Medium'})
        if 'tensorflow' not in all_skills and 'pytorch' not in all_skills:
            recommendations.append({'skill': 'TensorFlow', 'reason': 'Growing demand in AI/ML engineering', 'priority': 'Medium'})

        # AI-POWERED ADVANCED ANALYTICS
        ai_analysis = analyze_skills(
            user_skills=skills['technical'],
            experience_years=experience_years,
            cv_text=cv_text
        )

        return jsonify({
            # Existing data (preserved for charts)
            'skill_match_score': round(sum(s['confidence'] for s in skill_analysis) / max(len(skill_analysis), 1), 1),
            'technical_skills': skill_analysis,
            'soft_skills': skills['soft'],
            'learning_path': recommendations,
            'experience_years': data.get('experience_years', 'Not detected'),

            # NEW AI-POWERED DATA
            'ai_analysis': {
                'missing_skills': ai_analysis['missing_skills'],
                'skills_requiring_improvement': ai_analysis['skills_requiring_improvement'],
                'career_roadmap': ai_analysis['career_roadmap'],
                'recommended_courses': ai_analysis['recommended_courses'],
                'career_readiness': ai_analysis['career_readiness'],
                'primary_domain': ai_analysis['primary_domain'],
                'domain_insights': ai_analysis['domain_insights']
            }
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500
    
# ========== JOB DETAILS ==========

@app.route('/job/<job_id>', methods=['GET'])
@jwt_required()
def get_job_details(job_id):
    """Get detailed job information with AI enrichment."""
    try:
        # In a real system, this would fetch from a jobs database
        # For now, we reconstruct from the stored recommendation or fetch fresh
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Try to find in user's recent recommendations (stored in session or fetch fresh)
        # For demo, we return a structured response that the frontend can use
        return jsonify({
            'job_id': job_id,
            'message': 'Use the job data stored from recommendations. This endpoint validates access.'
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ========== CV MATCH ANALYSIS ==========

@app.route('/cv_match', methods=['POST'])
@jwt_required()
def cv_match():
    """Analyze how well a user's CV matches a specific job."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing request body'}), 400

        job_title = data.get('job_title', '')
        job_description = data.get('job_description', '')
        job_id = data.get('job_id', '')

        # Get user's CV
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not user.cv_data:
            return jsonify({'error': 'No CV uploaded. Please upload your CV first.'}), 400

        try:
            cv_data = json.loads(user.cv_data)
            cv_text = cv_data.get('cleaned_text', '') or cv_data.get('raw_text', '')
            user_skills = cv_data.get('extracted_skills', {}).get('technical', [])
        except:
            return jsonify({'error': 'Corrupted CV data'}), 500

        # AI-powered match analysis
        result = match_cv_to_job(cv_text, job_title, job_description, user_skills)

        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500


# ========== JOB INTELLIGENCE ==========

@app.route('/job_intelligence', methods=['POST'])
@jwt_required()
def job_intelligence():
    """Generate AI intelligence for a job posting."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing request body'}), 400

        job_title = data.get('job_title', '')
        job_description = data.get('job_description', '')
        company = data.get('company', '')
        industry = data.get('industry', 'Technology')

        # AI-powered job intelligence
        result = analyze_job_intelligence(job_title, job_description, company, industry)

        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500


# ========== CV OPTIMIZATION (Phase 5 Preview) ==========

@app.route('/optimize_cv', methods=['POST'])
@jwt_required()
def optimize_cv():
    """
    AI-powered CV optimization for a target job.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Check premium access
        if user.subscription_tier != 'premium':
            return jsonify({
                'error': 'Premium required',
                'message': 'CV Optimization is a premium feature. Upgrade to Demo Premium.'
            }), 403

        data = request.get_json()
        job_title = data.get('job_title', '')
        job_description = data.get('job_description', '')

        if not user.cv_data:
            return jsonify({'error': 'No CV uploaded'}), 400

        try:
            cv_data = json.loads(user.cv_data)
            cv_text = cv_data.get('cleaned_text', '') or cv_data.get('raw_text', '')
        except:
            return jsonify({'error': 'Corrupted CV data'}), 500

        # AI optimization
        result = cv_optimize(cv_text, job_title, job_description)

        return jsonify({
            'message': 'CV optimized successfully',
            'optimized_summary': result['optimized_summary'],
            'target_role': result['target_role'],
            'suggestions': result['suggestions'],
            'keyword_matches': result['keyword_matches'],
            'missing_keywords': result['missing_keywords'],
            'ats_score_before': result['ats_score_before'],
            'ats_score_after': result['ats_score_after'],
            'note': 'Full PDF/DOCX generation coming in next release'
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/generate_pdf', methods=['POST'])
@jwt_required()
def generate_pdf():
    """
    Generate PDF from optimized CV.
    Stub for future implementation.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.subscription_tier != 'premium':
            return jsonify({'error': 'Premium required'}), 403

        return jsonify({
            'message': 'PDF generation endpoint ready',
            'status': 'preview',
            'note': 'Full PDF generation with reportlab will be implemented in the next release'
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/generate_docx', methods=['POST'])
@jwt_required()
def generate_docx():
    """
    Generate DOCX from optimized CV.
    Stub for future implementation.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.subscription_tier != 'premium':
            return jsonify({'error': 'Premium required'}), 403

        return jsonify({
            'message': 'DOCX generation endpoint ready',
            'status': 'preview',
            'note': 'Full DOCX generation with python-docx will be implemented in the next release'
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)