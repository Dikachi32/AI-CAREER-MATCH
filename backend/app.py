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
from auth import auth_bp, bcrypt
from datetime import datetime
from services.ai_job_intelligence import analyze_job_intelligence, match_cv_to_job
from services.ai_skill_analytics import analyze_skills
from services.cv_optimizer import optimize_cv as cv_optimize
from routes.ai_career_intelligence import ai_career_bp
from services.ai_career_intelligence import generate_career_roadmap, generate_combined_intelligence
from services.cv_optimizer import optimize_cv, quick_ats_check
from interview_copilot import generate_interview_prep, generate_quick_interview_prep


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

# Initialize extensions
jwt = JWTManager(app)
db.init_app(app)
bcrypt.init_app(app)
app.register_blueprint(auth_bp)
app.register_blueprint(ai_career_bp)

with app.app_context():
    db.create_all()

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
matcher = JobMatcher(model_name=Config.EMBEDDING_MODEL, jobs_json_path=Config.JOBS_JSON_PATH)

ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def _add_cors_headers(response):
    """Ensure CORS headers are present even on error responses."""
    origin = request.headers.get('Origin')
    if origin and origin in Config.CORS_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# ========== ERROR HANDLERS ==========

@app.errorhandler(404)
def not_found(error):
    response = jsonify({'error': 'Resource not found'})
    response.status_code = 404
    return _add_cors_headers(response)

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    response = jsonify({'error': 'Internal server error'})
    response.status_code = 500
    return _add_cors_headers(response)

@app.errorhandler(RequestEntityTooLarge)
def too_large(error):
    response = jsonify({'error': 'File too large. Max size is 16MB.'})
    response.status_code = 413
    return _add_cors_headers(response)

@app.errorhandler(Exception)
def handle_unhandled_exception(e):
    """Catch-all for unhandled exceptions so CORS headers are always present."""
    db.session.rollback()
    traceback.print_exc()
    response = jsonify({
        'error': 'Internal server error',
        'details': str(e) if app.debug else None
    })
    response.status_code = 500
    return _add_cors_headers(response)

# ========== JWT ERROR HANDLERS ==========

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    response = jsonify({'error': 'Token expired. Please log in again.'})
    response.status_code = 401
    return _add_cors_headers(response)

@jwt.invalid_token_loader
def invalid_token_callback(error):
    response = jsonify({'error': 'Invalid authentication token.', 'details': str(error)})
    response.status_code = 422
    return _add_cors_headers(response)

@jwt.unauthorized_loader
def unauthorized_callback(error):
    response = jsonify({'error': 'Authorization required. Please log in.'})
    response.status_code = 401
    return _add_cors_headers(response)

@jwt.needs_fresh_token_loader
def token_not_fresh_callback(jwt_header, jwt_payload):
    response = jsonify({'error': 'Fresh token required. Please log in again.'})
    response.status_code = 401
    return _add_cors_headers(response)

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    response = jsonify({'error': 'Token has been revoked. Please log in again.'})
    response.status_code = 401
    return _add_cors_headers(response)

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
                    return jsonify({'error': 'Failed to parse CV', 'details': str(e)}), 500
            else:
                return jsonify({'error': 'Invalid file type. Only PDF and DOCX allowed.'}), 400
        else:
            # Handle text-only CV paste
            data = request.get_json(silent=True) or {}
            cv_text = data.get('cv_text', '').strip()
            if not cv_text:
                return jsonify({'error': 'No CV file or text provided'}), 400

            skills = extract_skills(cv_text)
            
            # Persist text CV
            user.cv_data = json.dumps({
                'extracted_info': {},
                'extracted_skills': skills,
                'cleaned_text': cv_text[:10000],
                'raw_text': cv_text[:5000]
            })
            user.cv_uploaded_at = datetime.utcnow()
            db.session.commit()

            return jsonify({
                'message': 'CV text processed successfully',
                'extracted_skills': skills,
                'user': user.to_dict()
            }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Server error during CV upload', 'details': str(e)}), 500

# ========== JOB RECOMMENDATIONS ==========

@app.route('/recommendations', methods=['POST'])
@jwt_required()
def get_recommendations():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json(silent=True) or {}
        location = data.get('location', user.location or '').strip()
        job_title = data.get('job_title', user.title or '').strip()

        if not location and not job_title:
            return jsonify({'error': 'Please provide location or job title'}), 400

        # Fetch real jobs from JSearch API
        jobs = fetch_real_jobs(query=job_title or 'software engineer', location=location or 'United States')

        # Get user's CV text for matching
        cv_text = ''
        user_skills = []
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
                user_skills = cv_data.get('extracted_skills', [])
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data

        # Match jobs against CV
        matched_jobs = matcher.match_jobs(cv_text, jobs, top_n=10)

        # Add AI intelligence to top matches
        enriched_jobs = []
        for job in matched_jobs[:5]:
            job_copy = dict(job)
            try:
                intelligence = analyze_job_intelligence(
                    job_title=job.get('title', ''),
                    job_description=job.get('description', ''),
                    company=job.get('company', ''),
                    industry=job.get('industry', '')
                )
                job_copy['ai_intelligence'] = intelligence
            except Exception as e:
                job_copy['ai_intelligence'] = {'error': str(e)}
            enriched_jobs.append(job_copy)

        # Add remaining jobs without intelligence
        enriched_jobs.extend([dict(j) for j in matched_jobs[5:]])

        return jsonify({
            'jobs': enriched_jobs,
            'total': len(enriched_jobs),
            'location': location,
            'query': job_title
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to get recommendations', 'details': str(e)}), 500

# ========== AI JOB INTELLIGENCE (LEGACY) ==========

@app.route('/job-intelligence', methods=['POST'])
@jwt_required()
def job_intelligence():
    try:
        data = request.get_json(silent=True) or {}
        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()

        if not job_title or not job_description:
            return jsonify({'error': 'job_title and job_description are required'}), 400

        intelligence = analyze_job_intelligence(
            job_title=job_title,
            job_description=job_description,
            company=data.get('company', ''),
            industry=data.get('industry', '')
        )

        return jsonify({'intelligence': intelligence}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to analyze job', 'details': str(e)}), 500

# ========== CV-JOB MATCHING ==========

@app.route('/match-cv-job', methods=['POST'])
@jwt_required()
def match_cv_job():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json(silent=True) or {}
        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()

        if not job_title or not job_description:
            return jsonify({'error': 'job_title and job_description are required'}), 400

        # Get user's CV text and skills
        cv_text = ''
        user_skills = []
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
                user_skills = cv_data.get('extracted_skills', [])
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data

        if not cv_text:
            return jsonify({'error': 'No CV found. Please upload a CV first.'}), 400

        match_result = match_cv_to_job(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            user_skills=user_skills
        )

        return jsonify({'match': match_result}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to match CV to job', 'details': str(e)}), 500

# ========== SKILL ANALYTICS ==========

@app.route('/skill-analytics', methods=['POST'])
@jwt_required()
def skill_analytics():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json(silent=True) or {}
        target_role = data.get('target_role', '').strip()

        if not target_role:
            return jsonify({'error': 'target_role is required'}), 400

        # Get user's skills from CV
        user_skills = []
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                user_skills = cv_data.get('extracted_skills', [])
            except (json.JSONDecodeError, AttributeError):
                pass

        if not user_skills:
            return jsonify({'error': 'No skills found. Please upload a CV first.'}), 400

        analytics = analyze_skills(
            user_skills=user_skills,
            target_role=target_role
        )

        return jsonify({'analytics': analytics}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to analyze skills', 'details': str(e)}), 500

# ========== CV OPTIMIZATION ==========

@app.route('/optimize-cv', methods=['POST'])
@jwt_required()
def optimize_cv():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check premium access
        if user.subscription_tier != 'premium':
            return jsonify({
                'error': 'CV optimization requires Premium subscription',
                'upgrade_required': True
            }), 403

        data = request.get_json(silent=True) or {}
        target_job = data.get('target_job', '').strip()

        if not target_job:
            return jsonify({'error': 'target_job is required'}), 400

        # Get CV text
        cv_text = ''
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data

        if not cv_text:
            return jsonify({'error': 'No CV found. Please upload a CV first.'}), 400

        optimized = cv_optimize(
            cv_text=cv_text,
            target_job=target_job
        )

        return jsonify({
            'optimized_cv': optimized.get('optimized_text', ''),
            'improvements': optimized.get('improvements', []),
            'ats_score_before': optimized.get('ats_score_before', 0),
            'ats_score_after': optimized.get('ats_score_after', 0)
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to optimize CV', 'details': str(e)}), 500

@app.route('/api/v3/ai-career/roadmap', methods=['POST'])
@jwt_required()
def career_roadmap():
    """
    POST /api/v3/ai-career/roadmap
    
    Phase 3: Generate personalized career roadmap and skill gap analysis.
    Includes learning timeline, certifications, portfolio projects, next role, salary projection.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json(silent=True) or {}
        
        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not job_title or not job_description:
            return jsonify({'error': 'job_title and job_description are required'}), 400

        # Get CV text and AI profile
        cv_text = ''
        user_skills = []
        ai_profile = None
        
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
                user_skills = cv_data.get('extracted_skills', [])
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data

        # Get AI profile if available
        try:
            ai_profile = AIProfile.query.filter_by(user_id=user.id).first()
        except:
            ai_profile = None

        if not cv_text:
            return jsonify({'error': 'No CV found. Please upload a CV first.'}), 400

        # Generate Phase 3 roadmap
        result = generate_career_roadmap(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            company_name=data.get('company_name'),
            industry=data.get('industry'),
            ai_profile=ai_profile,
            user_skills=user_skills
        )

        if result.get('success'):
            return jsonify({
                'success': True,
                'roadmap': result['data'],
                'source': result.get('source'),
                'model': result.get('model')
            }), 200
        
        return jsonify({
            'success': False,
            'error': 'Roadmap generation failed',
            'details': result.get('data', {})
        }), 503

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to generate career roadmap', 'details': str(e)}), 500


@app.route('/api/v3/ai-career/combined', methods=['POST'])
@jwt_required()
def combined_intelligence():
    """
    POST /api/v3/ai-career/combined
    
    Phase 3: Generate both intelligence analysis AND career roadmap in one call.
    Optimized for the JobDetails page to reduce API calls.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json(silent=True) or {}
        
        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not job_title or not job_description:
            return jsonify({'error': 'job_title and job_description are required'}), 400

        # Get CV text and AI profile
        cv_text = ''
        user_skills = []
        ai_profile = None
        
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
                user_skills = cv_data.get('extracted_skills', [])
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data

        try:
            ai_profile = AIProfile.query.filter_by(user_id=user.id).first()
        except:
            ai_profile = None

        if not cv_text:
            return jsonify({'error': 'No CV found. Please upload a CV first.'}), 400

        # Generate combined intelligence + roadmap
        result = generate_combined_intelligence(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            company_name=data.get('company_name'),
            industry=data.get('industry'),
            ai_profile=ai_profile,
            user_skills=user_skills
        )

        if result.get('success'):
            return jsonify({
                'success': True,
                'intelligence': result['data']['intelligence'],
                'roadmap': result['data']['roadmap'],
                'source': result.get('source'),
                'model': result.get('model')
            }), 200
        
        return jsonify({
            'success': False,
            'error': 'Combined intelligence generation failed',
            'details': result.get('data', {})
        }), 503

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to generate combined intelligence', 'details': str(e)}), 500

@app.route('/optimize_cv', methods=['POST'])
@jwt_required()
def optimize_cv_endpoint():
    """
    POST /optimize_cv
    
    Phase 4: AI-powered CV Optimizer & ATS Enhancement.
    Analyzes CV against job description and returns:
    - ATS scores (overall, formatting, keyword match, readability, completeness)
    - Resume match score
    - Keyword analysis (matched/missing)
    - Missing skills
    - Rewritten professional summary, experience bullets, skills section
    - Formatting suggestions
    - Grammar fixes
    - Recruiter feedback
    - Action plan
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json(silent=True) or {}
        
        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not job_title or not job_description:
            return jsonify({'error': 'job_title and job_description are required'}), 400

        # Get CV text
        cv_text = ''
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data

        if not cv_text:
            return jsonify({'error': 'No CV found. Please upload a CV first.'}), 400

        # Generate Phase 4 optimization
        result = optimize_cv(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description
        )

        if result.get('success'):
            return jsonify({
                'success': True,
                'optimization': result['data'],
                'source': result.get('source'),
                'model': result.get('model')
            }), 200
        
        return jsonify({
            'success': False,
            'error': 'CV optimization failed',
            'details': result.get('data', {})
        }), 503

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to optimize CV', 'details': str(e)}), 500


@app.route('/quick_ats_check', methods=['POST'])
@jwt_required()
def quick_ats_check_endpoint():
    """
    POST /quick_ats_check
    
    Phase 4: Quick ATS compatibility check.
    Minimal token usage for rapid feedback.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json(silent=True) or {}
        
        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not job_title or not job_description:
            return jsonify({'error': 'job_title and job_description are required'}), 400

        cv_text = ''
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                cv_text = cv_data.get('raw_text', '') or cv_data.get('cleaned_text', '')
            except (json.JSONDecodeError, AttributeError):
                cv_text = user.cv_data

        if not cv_text:
            return jsonify({'error': 'No CV found. Please upload a CV first.'}), 400

        result = quick_ats_check(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description
        )

        if result.get('success'):
            return jsonify({
                'success': True,
                'ats_check': result['data'],
                'source': result.get('source')
            }), 200
        
        return jsonify({
            'success': False,
            'error': 'ATS check failed',
            'details': result.get('error')
        }), 503

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': 'Failed to check ATS compatibility', 'details': str(e)}), 500

# ========== SAVED JOBS ==========

@app.route('/saved-jobs', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def saved_jobs():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if request.method == 'GET':
        # Return saved jobs from user data (stored as JSON in cv_data for demo)
        saved = []
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                saved = cv_data.get('saved_jobs', [])
            except (json.JSONDecodeError, AttributeError):
                pass
        return jsonify({'saved_jobs': saved}), 200

    elif request.method == 'POST':
        data = request.get_json(silent=True) or {}
        job = data.get('job')

        if not job:
            return jsonify({'error': 'job data is required'}), 400

        # Check save limits for free users
        current_saved = []
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                current_saved = cv_data.get('saved_jobs', [])
            except (json.JSONDecodeError, AttributeError):
                pass

        if user.subscription_tier != 'premium' and len(current_saved) >= Config.DEMO_FREE_FEATURES['maxJobSaves']:
            return jsonify({
                'error': 'Save limit reached. Upgrade to Demo Premium for unlimited saves.'
            }), 403

        # Add job to saved jobs
        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                if 'saved_jobs' not in cv_data:
                    cv_data['saved_jobs'] = []
                cv_data['saved_jobs'].append(job)
                user.cv_data = json.dumps(cv_data)
            except (json.JSONDecodeError, AttributeError):
                user.cv_data = json.dumps({'saved_jobs': [job]})
        else:
            user.cv_data = json.dumps({'saved_jobs': [job]})

        db.session.commit()
        return jsonify({'message': 'Job saved', 'saved_jobs': json.loads(user.cv_data).get('saved_jobs', [])}), 201

    elif request.method == 'DELETE':
        data = request.get_json(silent=True) or {}
        job_id = data.get('job_id')

        if not job_id:
            return jsonify({'error': 'job_id is required'}), 400

        if user.cv_data:
            try:
                cv_data = json.loads(user.cv_data)
                saved = cv_data.get('saved_jobs', [])
                cv_data['saved_jobs'] = [j for j in saved if j.get('id') != job_id and j.get('job_id') != job_id]
                user.cv_data = json.dumps(cv_data)
                db.session.commit()
                return jsonify({'message': 'Job removed', 'saved_jobs': cv_data['saved_jobs']}), 200
            except (json.JSONDecodeError, AttributeError):
                pass

        return jsonify({'error': 'Job not found'}), 404
    
@app.route('/interview_copilot', methods=['POST'])
@jwt_required()
def interview_copilot():
    """
    Generate personalized interview preparation.
    Expects JSON with: job_title, job_description, job_company (opt),
    job_location (opt), experience_level (opt), cv_text (opt).
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing request body'}), 400

        job_title = data.get('job_title', '').strip()
        job_description = data.get('job_description', '').strip()

        if not job_title or not job_description:
            return jsonify({'error': 'job_title and job_description are required'}), 400

        job_company = data.get('job_company', '').strip()
        job_location = data.get('job_location', '').strip()
        experience_level = data.get('experience_level', '').strip()
        cv_text = data.get('cv_text', '').strip()

        # Build cv_data from cv_text if provided, else use minimal
        cv_data = None
        if cv_text:
            skills = extract_skills(cv_text)
            cv_data = {
                'extracted_info': {
                    'full_name': '', 'latest_job_title': '', 'current_company': '',
                    'location': '', 'years_experience': '', 'education': '',
                    'certifications': []
                },
                'extracted_skills': skills,
                'cleaned_text': cv_text[:2000]
            }
        else:
            # Try to get user's profile for enrichment
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if user:
                cv_data = {
                    'extracted_info': {
                        'full_name': user.name,
                        'latest_job_title': user.title or '',
                        'current_company': user.company or '',
                        'location': user.location or '',
                        'years_experience': '', 'education': '', 'certifications': []
                    },
                    'extracted_skills': {'technical': [], 'soft': []},
                    'cleaned_text': ''
                }

        result = generate_interview_prep(
            cv_data=cv_data,
            job_title=job_title,
            job_description=job_description,
            job_company=job_company,
            job_location=job_location,
            experience_level=experience_level
        )

        return jsonify({
            'success': True,
            'interview_prep': result
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Interview copilot failed: {str(e)}'}), 500

# ========== MAIN ==========

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)