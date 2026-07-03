import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from config import Config
from preprocessing.cv_parser import parse_cv
from preprocessing.skill_extractor import extract_skills
from recommendation.embedding_matcher import JobMatcher
from recommendation.job_fetcher import fetch_real_jobs
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from models import db, User
from auth import auth_bp
from datetime import datetime

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})

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


@app.before_request
def log_request():
    print(f"\n>>> REQUEST: {request.method} {request.path}")
    print(f"    Content-Type: {request.content_type}")
    auth_header = request.headers.get('Authorization', 'NONE')
    if auth_header != 'NONE' and len(auth_header) > 60:
        print(f"    Authorization: {auth_header[:60]}...")


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


@app.route('/upload_cv', methods=['POST'])
@jwt_required()
def upload_cv():
    print(">>> ENTERED upload_cv route")
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        print(f">>> request.files keys: {list(request.files.keys())}")
        
        if 'cv' in request.files:
            file = request.files['cv']
            print(f">>> File received: name='{file.filename}'")
            
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
        
        data = request.get_json(silent=True)
        if not data or 'cv_text' not in data:
            return jsonify({'error': 'No CV file or text provided'}), 400
        
        cv_text = data['cv_text']
        skills = extract_skills(cv_text)
        
        return jsonify({
            'message': 'CV text processed successfully',
            'extracted_skills': skills,
            'extracted_info': {
                'full_name': None,
                'email': None,
                'phone': None,
                'location': None,
                'years_experience': None,
                'education': None,
                'latest_job_title': None,
                'current_company': None,
                'certifications': []
            },
            'cleaned_text': cv_text[:500] + '...'
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500


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
        
        # Extract skills from CV
        skills_data = extract_skills(cv_text) if cv_text else {'technical': [], 'soft': []}
        user_skills = skills_data['technical']
        
        # FIX: Build proper job title keyword for JSearch
        # Priority: user's latest job title > top skill + "developer/engineer" > generic fallback
        keyword = data.get('keyword', '').strip()
        
        if not keyword:
            # Try to infer job title from CV text
            cv_lower = cv_text.lower()
            
            # Check for common job titles in CV text
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
                # Use top skill + "developer" or "engineer"
                top_skill = user_skills[0]
                keyword = f"{top_skill} developer"
            else:
                keyword = 'software engineer'
        
        print(f"[Recommend] Keyword: '{keyword}' | Location: '{location}' | Skills: {user_skills[:5]}")
        
        # ========== FETCH REAL JOBS FROM JSEARCH API ==========
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
        
        # Match CV against real jobs
        results = []
        for job in real_jobs:
            job_text = (job.get('description', '') + ' ' + job.get('title', '')).lower()
            
            matched_skills = [skill for skill in user_skills if skill.lower() in job_text]
            match_score = min(98, 25 + len(matched_skills) * 12) if matched_skills else 15
            
            # Apply filters
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


@app.route('/analytics', methods=['POST'])
@jwt_required()
def get_analytics():
    try:
        data = request.get_json()
        if not data or 'cv_text' not in data:
            return jsonify({'error': 'Missing cv_text'}), 400
        
        cv_text = data['cv_text']
        skills = extract_skills(cv_text)
        
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
        
        return jsonify({
            'skill_match_score': round(sum(s['confidence'] for s in skill_analysis) / max(len(skill_analysis), 1), 1),
            'technical_skills': skill_analysis,
            'soft_skills': skills['soft'],
            'learning_path': recommendations,
            'experience_years': data.get('experience_years', 'Not detected')
        }), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500


@app.route('/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'jobs_analyzed': 50000,
        'cvs_processed': 10000,
        'matching_accuracy': 95,
        'partner_companies': 500,
        'active_users': 2500
    }), 200


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'AI Career Recommendation API is running',
        'version': '2.0.0',
        'timestamp': datetime.utcnow().isoformat()
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)