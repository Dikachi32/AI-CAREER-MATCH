"""
AI Career Coach & Dashboard — Phase 6
Generates personalized career guidance using Gemini AI.
Combines CV, skills, experience, and market intelligence.
"""

import json
import os
import re
import traceback
from datetime import datetime, timedelta

# ── Reuse existing Gemini client ───────────────────────────────────────────────
_gemini_model = None


def _get_gemini_model():
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    try:
        import google.generativeai as genai
        from config import Config

        api_key = getattr(Config, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise RuntimeError('GEMINI_API_KEY not configured')

        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        return _gemini_model
    except Exception as e:
        print(f"[CareerCoach] Gemini init error: {e}")
        raise


# ── Prompt builder ─────────────────────────────────────────────────────────────

CAREER_DASHBOARD_PROMPT = """
You are an elite AI Career Strategist with experience coaching professionals at FAANG, Fortune 500, and high-growth startups.

TASK: Generate a comprehensive, personalized career dashboard analysis for the candidate below.

═══════════════════════════════════════════════════════════════════
CANDIDATE PROFILE
═══════════════════════════════════════════════════════════════════
• Name: {name}
• Current Title: {title}
• Company: {company}
• Location: {location}
• Years of Experience: {years_experience}
• Education: {education}
• Technical Skills: {technical_skills}
• Soft Skills: {soft_skills}
• Certifications: {certifications}
• CV Summary: {cv_summary}

═══════════════════════════════════════════════════════════════════
CAREER INTELLIGENCE
═══════════════════════════════════════════════════════════════════
• Job Match Score: {job_match_score}%
• Top Matched Role: {top_matched_role}
• Skills Gap: {skills_gap}
• Market Demand for Skills: {market_demand}
• Recent Analytics: {analytics_summary}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON
═══════════════════════════════════════════════════════════════════
Return ONLY a valid JSON object (no markdown, no code fences). The JSON must match this exact structure:

{{
  "careerHealthScore": <integer 0-100>,
  "careerHealthLabel": "<One of: Critical | Needs Attention | Stable | Healthy | Thriving>",
  "careerHealthColor": "<One of: red | orange | amber | emerald | green>",
  "careerReadinessScore": <integer 0-100>,
  "careerReadinessLabel": "<One of: Not Ready | Building | Nearly Ready | Ready | Highly Competitive>",
  "careerReadinessColor": "<One of: red | orange | amber | emerald | green>",
  "atsImprovementProgress": {{
    "currentScore": <integer 0-100>,
    "targetScore": 85,
    "improvementsMade": ["<improvement 1>", "<improvement 2>"],
    "nextSteps": ["<step 1>", "<step 2>"]
  }},
  "skillsProgress": [
    {{
      "skill": "<skill name>",
      "currentLevel": "<Beginner | Intermediate | Advanced | Expert>",
      "targetLevel": "<Intermediate | Advanced | Expert>",
      "progressPercent": <integer 0-100>,
      "category": "<Technical | Soft | Domain | Leadership>"
    }}
  ],
  "highDemandSkillsMissing": [
    {{
      "skill": "<skill name>",
      "demandScore": <integer 0-100>,
      "whyImportant": "<why this skill matters>",
      "timeToLearn": "<e.g., 2-4 weeks>",
      "resources": ["<resource 1>", "<resource 2>"]
    }}
  ],
  "careerStrengths": [
    {{
      "strength": "<strength description>",
      "evidence": "<evidence from CV>",
      "howToLeverage": "<how to use this in career>"
    }}
  ],
  "careerWeaknesses": [
    {{
      "weakness": "<weakness description>",
      "impact": "<career impact>",
      "actionToFix": "<specific action>"
    }}
  ],
  "recommendedLearningPath": [
    {{
      "step": 1,
      "title": "<learning title>",
      "description": "<what to learn>",
      "duration": "<time estimate>",
      "priority": "<Critical | High | Medium | Low>",
      "resources": ["<resource 1>"]
    }}
  ],
  "recommendedCertifications": [
    {{
      "name": "<cert name>",
      "provider": "<e.g., AWS, Google, Microsoft>",
      "relevanceScore": <integer 0-100>,
      "whyRecommended": "<personalized reason>",
      "estimatedCost": "<e.g., $150-300>",
      "timeToComplete": "<e.g., 3-6 months>",
      "careerImpact": "<how it helps>"
    }}
  ],
  "suggestedPortfolioProjects": [
    {{
      "title": "<project title>",
      "description": "<what to build>",
      "skillsDemonstrated": ["<skill 1>", "<skill 2>"],
      "difficulty": "<Beginner | Intermediate | Advanced>",
      "timeEstimate": "<e.g., 2-4 weeks>",
      "whyRelevant": "<why this project matters for career>"
    }}
  ],
  "recommendedNextRoles": [
    {{
      "role": "<job title>",
      "timeline": "<e.g., 0-6 months | 6-12 months | 1-2 years>",
      "salaryRange": "<e.g., $120k-$160k>",
      "whyRecommended": "<personalized reason>",
      "gapToClose": ["<skill 1>", "<skill 2>"]
    }}
  ],
  "salaryGrowthProjection": [
    {{
      "year": 1,
      "projectedSalary": "<e.g., $95,000>",
      "role": "<expected role>",
      "keyDriver": "<what enables this growth>"
    }},
    {{
      "year": 2,
      "projectedSalary": "<e.g., $115,000>",
      "role": "<expected role>",
      "keyDriver": "<what enables this growth>"
    }},
    {{
      "year": 3,
      "projectedSalary": "<e.g., $140,000>",
      "role": "<expected role>",
      "keyDriver": "<what enables this growth>"
    }},
    {{
      "year": 5,
      "projectedSalary": "<e.g., $180,000>",
      "role": "<expected role>",
      "keyDriver": "<what enables this growth>"
    }}
  ],
  "careerMilestones": [
    {{
      "milestone": "<milestone description>",
      "targetDate": "<e.g., 3 months | 6 months | 1 year>",
      "category": "<Skill | Role | Certification | Project | Network>",
      "isAchieved": false
    }}
  ],
  "weeklyGoals": [
    {{
      "goal": "<specific weekly goal>",
      "category": "<Learning | Application | Networking | Interview Prep>",
      "priority": "<Critical | High | Medium>",
      "completed": false
    }}
  ],
  "monthlyGoals": [
    {{
      "goal": "<specific monthly goal>",
      "category": "<Learning | Role Transition | Certification | Project | Salary Negotiation>",
      "priority": "<Critical | High | Medium>",
      "completed": false
    }}
  ],
  "personalizedActionPlan": [
    {{
      "action": "<specific action>",
      "deadline": "<e.g., This week | This month | 3 months>",
      "impact": "<career impact>",
      "priority": "<Critical | High | Medium | Low>",
      "category": "<Skill | Role | Network | Interview | Compensation>"
    }}
  ],
  "aiCareerSummary": {{
    "currentStanding": "<2-3 sentence assessment of where the candidate stands>",
    "biggestOpportunity": "<the single biggest career opportunity>",
    "biggestRisk": "<the single biggest career risk>",
    "oneYearVision": "<where the candidate could be in 1 year with focused effort>",
    "recommendedFocus": "<the ONE thing to focus on right now>",
    "motivationalMessage": "<personalized encouraging message>"
  }}
}}

RULES:
1. Every recommendation must be PERSONALIZED to the candidate's actual profile, not generic.
2. Salary projections must be realistic based on location, experience, and current market.
3. Career milestones must be achievable and sequenced logically.
4. The career health score should reflect actual gaps between current state and market demands.
5. All JSON keys must be present. Use empty arrays/strings if a field has no data, but NEVER omit a key.
6. Return ONLY the JSON object. No markdown formatting, no ```json blocks, no explanatory text.
"""


def _build_cv_summary(cv_data):
    """Build a concise CV summary from parsed CV data."""
    parts = []
    info = cv_data.get('extracted_info', {}) if cv_data else {}
    if info.get('latest_job_title'):
        parts.append(f"Currently works as {info['latest_job_title']}")
    if info.get('current_company'):
        parts.append(f"at {info['current_company']}")
    if info.get('years_experience'):
        parts.append(f"with {info['years_experience']} years of experience")
    if info.get('education'):
        parts.append(f". Education: {info['education']}")

    skills = cv_data.get('extracted_skills', {}) if cv_data else {}
    tech = skills.get('technical', [])
    if tech:
        parts.append(f". Technical skills include: {', '.join(tech[:15])}")

    raw = cv_data.get('cleaned_text', cv_data.get('raw_text', ''))
    summary = ' '.join(parts) if parts else raw[:500]
    return summary[:1500]


def _clean_json_response(text):
    """Remove markdown fences and extraneous text from Gemini response."""
    text = re.sub(r'^\s*```(?:json)?\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*```\s*$', '', text)
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]
    return text.strip()


def _validate_and_fill(data):
    """Ensure all required keys exist with sensible defaults."""
    defaults = {
        'careerHealthScore': 60,
        'careerHealthLabel': 'Stable',
        'careerHealthColor': 'amber',
        'careerReadinessScore': 55,
        'careerReadinessLabel': 'Building',
        'careerReadinessColor': 'amber',
        'atsImprovementProgress': {
            'currentScore': 60,
            'targetScore': 85,
            'improvementsMade': [],
            'nextSteps': ['Optimize keywords', 'Improve formatting']
        },
        'skillsProgress': [],
        'highDemandSkillsMissing': [],
        'careerStrengths': [],
        'careerWeaknesses': [],
        'recommendedLearningPath': [],
        'recommendedCertifications': [],
        'suggestedPortfolioProjects': [],
        'recommendedNextRoles': [],
        'salaryGrowthProjection': [
            {'year': 1, 'projectedSalary': 'Current + 10%', 'role': 'Same level', 'keyDriver': 'Skill refinement'},
            {'year': 2, 'projectedSalary': 'Current + 20%', 'role': 'Senior level', 'keyDriver': 'Leadership skills'},
            {'year': 3, 'projectedSalary': 'Current + 35%', 'role': 'Lead/Staff', 'keyDriver': 'Specialization'},
            {'year': 5, 'projectedSalary': 'Current + 60%', 'role': 'Principal/Architect', 'keyDriver': 'Domain expertise'}
        ],
        'careerMilestones': [],
        'weeklyGoals': [],
        'monthlyGoals': [],
        'personalizedActionPlan': [],
        'aiCareerSummary': {
            'currentStanding': 'Career analysis in progress. Focus on skill development.',
            'biggestOpportunity': 'Upskilling in high-demand technologies',
            'biggestRisk': 'Skill stagnation without continuous learning',
            'oneYearVision': 'A stronger, more marketable professional profile',
            'recommendedFocus': 'Learn one high-demand skill deeply',
            'motivationalMessage': 'Every expert was once a beginner. Keep building.'
        }
    }

    for key, default in defaults.items():
        if key not in data or data[key] is None:
            data[key] = default

    # Ensure nested objects have required keys
    if 'atsImprovementProgress' in data and data['atsImprovementProgress']:
        ats = data['atsImprovementProgress']
        ats.setdefault('currentScore', 60)
        ats.setdefault('targetScore', 85)
        ats.setdefault('improvementsMade', [])
        ats.setdefault('nextSteps', [])

    if 'aiCareerSummary' in data and data['aiCareerSummary']:
        summary = data['aiCareerSummary']
        summary.setdefault('currentStanding', 'Analysis in progress')
        summary.setdefault('biggestOpportunity', 'Continuous learning')
        summary.setdefault('biggestRisk', 'Skill gaps')
        summary.setdefault('oneYearVision', 'Stronger profile')
        summary.setdefault('recommendedFocus', 'Skill development')
        summary.setdefault('motivationalMessage', 'Keep building')

    return data


def generate_career_dashboard(
    cv_data,
    user_profile,
    job_match_score=0,
    top_matched_role='',
    skills_gap='',
    market_demand='',
    analytics_summary=''
):
    """
    Generate personalized career dashboard using Gemini AI.
    """
    info = cv_data.get('extracted_info', {}) if cv_data else {}
    skills = cv_data.get('extracted_skills', {}) if cv_data else {}

    prompt = CAREER_DASHBOARD_PROMPT.format(
        name=info.get('full_name') or user_profile.get('name', 'Candidate'),
        title=info.get('latest_job_title') or user_profile.get('title', 'Not specified'),
        company=info.get('current_company') or user_profile.get('company', 'Not specified'),
        location=info.get('location') or user_profile.get('location', 'Not specified'),
        years_experience=str(info.get('years_experience') or 'Not specified'),
        education=info.get('education') or 'Not specified',
        technical_skills=', '.join(skills.get('technical', [])[:20]) or 'Not specified',
        soft_skills=', '.join(skills.get('soft', [])[:10]) or 'Not specified',
        certifications=', '.join(info.get('certifications', []) or []) or 'None',
        cv_summary=_build_cv_summary(cv_data) if cv_data else 'No CV data available',
        job_match_score=job_match_score,
        top_matched_role=top_matched_role or 'Not specified',
        skills_gap=skills_gap or 'Analysis pending',
        market_demand=market_demand or 'Analysis pending',
        analytics_summary=analytics_summary or 'Analysis pending'
    )

    try:
        model = _get_gemini_model()
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.35,
                'max_output_tokens': 8192,
                'top_p': 0.95,
                'top_k': 40,
            }
        )

        raw_text = response.text if hasattr(response, 'text') else str(response)
        cleaned = _clean_json_response(raw_text)
        parsed = json.loads(cleaned)
        return _validate_and_fill(parsed)

    except json.JSONDecodeError as e:
        print(f"[CareerCoach] JSON parse error: {e}")
        traceback.print_exc()
        return _validate_and_fill({})

    except Exception as e:
        print(f"[CareerCoach] Generation error: {e}")
        traceback.print_exc()
        return _validate_and_fill({})


def generate_quick_career_dashboard(cv_text, user_name=''):
    """Lightweight version when full data is not available."""
    minimal_cv = {
        'extracted_info': {
            'full_name': user_name or 'Candidate',
            'latest_job_title': '',
            'current_company': '',
            'location': '',
            'years_experience': '',
            'education': '',
            'certifications': []
        },
        'extracted_skills': {'technical': [], 'soft': []},
        'cleaned_text': cv_text[:2000] if cv_text else ''
    }
    return generate_career_dashboard(minimal_cv, {'name': user_name})