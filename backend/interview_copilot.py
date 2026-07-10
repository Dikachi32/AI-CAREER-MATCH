"""
AI Interview Copilot — Phase 5
Generates personalized interview preparation using Gemini AI.
Adapts questions, answers, and tips to the user's CV and target job.

Architecture:
- Reads Gemini model name from config.Config.GEMINI_MODEL (single source of truth).
- Uses the raw google.generativeai SDK directly (preserves generation_config support).
- Centralized _get_gemini_model() reads model from Config, not hardcoded string.
"""

import json
import os
import re
import traceback
from typing import Dict, Any

# ── Centralized Gemini model resolution ────────────────────────────────────────

def _get_gemini_model():
    """
    Initialize and return a Gemini GenerativeModel instance.
    Model name is read from config.Config.GEMINI_MODEL (canonical source).
    Falls back to environment variable, then to 'gemini-2.5-flash'.
    """
    import google.generativeai as genai
    from config import Config

    api_key = getattr(Config, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
    if not api_key:
        raise RuntimeError('GEMINI_API_KEY not configured')

    # Read model from centralized Config (single source of truth)
    model_name = getattr(Config, 'GEMINI_MODEL', 'gemini-2.5-flash')
    if not model_name:
        model_name = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash')
    model_name = model_name.strip()

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


# ── Prompt builder ─────────────────────────────────────────────────────────────

INTERVIEW_PROMPT_TEMPLATE = """
You are an elite AI Interview Coach with deep expertise in technical recruiting at FAANG and top-tier companies.

TASK: Generate a comprehensive, highly personalized interview preparation guide for the candidate below.

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
TARGET JOB
═══════════════════════════════════════════════════════════════════
• Job Title: {job_title}
• Company: {job_company}
• Job Description: {job_description}
• Required Skills: {required_skills}
• Experience Level: {experience_level}
• Location: {job_location}

═══════════════════════════════════════════════════════════════════
OUTPUT FORMAT — STRICT JSON
═══════════════════════════════════════════════════════════════════
Return ONLY a valid JSON object (no markdown, no code fences). The JSON must match this exact structure:

{{
  "readinessScore": <integer 0-100>,
  "readinessLabel": "<One of: Not Ready | Needs Work | Getting There | Well Prepared | Interview Ready>",
  "readinessColor": "<One of: red | orange | amber | emerald | green>",
  "technicalQuestions": [
    {{
      "id": "tq-1",
      "question": "<specific technical question tailored to the job and candidate skills>",
      "difficulty": "<Easy | Medium | Hard>",
      "category": "<e.g., Algorithms, System Design, Data Structures, Language-Specific, Framework, DevOps, ML/AI, Databases>",
      "suggestedAnswer": "<high-quality, detailed suggested answer>",
      "keyPoints": ["<point 1>", "<point 2>", "<point 3>"],
      "commonMistakes": ["<mistake 1>", "<mistake 2>"]
    }}
  ],
  "behavioralQuestions": [
    {{
      "id": "bq-1",
      "question": "<behavioral question tailored to candidate experience>",
      "framework": "<STAR | SOAR | CAR>",
      "suggestedAnswer": "<detailed suggested answer using the framework>",
      "keyPoints": ["<point 1>", "<point 2>", "<point 3>"],
      "commonMistakes": ["<mistake 1>", "<mistake 2>"]
    }}
  ],
  "roleSpecificQuestions": [
    {{
      "id": "rsq-1",
      "question": "<question specific to the exact role title>",
      "context": "<why this question matters for this role>",
      "suggestedAnswer": "<detailed answer>",
      "keyPoints": ["<point 1>", "<point 2>"],
      "commonMistakes": ["<mistake 1>"]
    }}
  ],
  "followUpQuestions": [
    {{
      "id": "fuq-1",
      "question": "<likely follow-up question>",
      "trigger": "<what answer would trigger this follow-up>",
      "suggestedAnswer": "<how to handle this follow-up>"
    }}
  ],
  "skillsToHighlight": [
    {{
      "skill": "<skill name>",
      "whyRelevant": "<why this skill matters for this job>",
      "howToDemonstrate": "<specific example from CV or project to mention>"
    }}
  ],
  "skillsLikelyEvaluated": [
    {{
      "skill": "<skill name>",
      "evaluationMethod": "<how interviewer will test this: coding, whiteboard, discussion, system design>",
      "preparationTip": "<specific tip to prepare>"
    }}
  ],
  "confidenceBuilders": [
    "<specific, actionable confidence-building recommendation 1>",
    "<specific, actionable confidence-building recommendation 2>"
  ],
  "preparationChecklist": [
    {{
      "item": "<checklist item>",
      "category": "<Research | Technical | Behavioral | Logistics | Materials>",
      "priority": "<Critical | High | Medium | Low>",
      "completed": false
    }}
  ],
  "commonMistakesToAvoid": [
    {{
      "mistake": "<mistake description>",
      "whyItHurts": "<impact on interview outcome>",
      "howToAvoid": "<specific prevention strategy>"
    }}
  ],
  "summary": {{
    "overallAssessment": "<2-3 sentence personalized assessment>",
    "strongestArea": "<what the candidate is strongest in>",
    "weakestArea": "<what needs most work>",
    "timeToPrepare": "<estimated hours needed>",
    "finalAdvice": "<1 paragraph of personalized final advice>"
  }}
}}

RULES:
1. Generate EXACTLY 5 technical questions, 4 behavioral questions, 3 role-specific questions, and 3 follow-up questions.
2. Every question must be PERSONALIZED — reference the candidate's actual skills, experience, and the job requirements.
3. Do NOT ask generic questions like "What is a closure?" — instead ask "Given your 3 years of React experience, explain how you would optimize a component re-rendering issue in a large-scale application."
4. Suggested answers must be detailed, structured, and demonstrate senior-level thinking.
5. The readiness score must be honest and based on actual skill gaps between the CV and job description.
6. All JSON keys must be present. Use empty arrays/strings if a field has no data, but NEVER omit a key.
7. Return ONLY the JSON object. No markdown formatting, no ```json blocks, no explanatory text.
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


def _extract_required_skills(job_description):
    """Extract likely required skills from job description."""
    return job_description[:2000] if job_description else ''


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
        'readinessScore': 50,
        'readinessLabel': 'Getting There',
        'readinessColor': 'amber',
        'technicalQuestions': [],
        'behavioralQuestions': [],
        'roleSpecificQuestions': [],
        'followUpQuestions': [],
        'skillsToHighlight': [],
        'skillsLikelyEvaluated': [],
        'confidenceBuilders': [
            "Review your top 3 projects and prepare concise 2-minute summaries.",
            "Practice explaining complex technical concepts to a non-technical audience."
        ],
        'preparationChecklist': [],
        'commonMistakesToAvoid': [],
        'summary': {
            'overallAssessment': 'Preparation guide generated. Review all sections carefully.',
            'strongestArea': 'Technical skills',
            'weakestArea': 'Interview technique',
            'timeToPrepare': '10-15 hours',
            'finalAdvice': 'Practice aloud with a timer. Record yourself and review.'
        }
    }

    for key, default in defaults.items():
        if key not in data or data[key] is None:
            data[key] = default

    for q_list_key in ['technicalQuestions', 'behavioralQuestions', 'roleSpecificQuestions', 'followUpQuestions']:
        for item in data.get(q_list_key, []):
            item.setdefault('id', 'q-unknown')
            item.setdefault('question', 'Question not generated')
            item.setdefault('suggestedAnswer', 'Answer not generated')
            item.setdefault('keyPoints', [])
            item.setdefault('commonMistakes', [])

    return data


def generate_interview_prep(
    cv_data,
    job_title,
    job_description,
    job_company='',
    job_location='',
    experience_level=''
):
    """
    Generate personalized interview preparation using Gemini AI.
    """
    info = cv_data.get('extracted_info', {}) if cv_data else {}
    skills = cv_data.get('extracted_skills', {}) if cv_data else {}

    prompt = INTERVIEW_PROMPT_TEMPLATE.format(
        name=info.get('full_name') or 'Candidate',
        title=info.get('latest_job_title') or 'Not specified',
        company=info.get('current_company') or 'Not specified',
        location=info.get('location') or 'Not specified',
        years_experience=str(info.get('years_experience') or 'Not specified'),
        education=info.get('education') or 'Not specified',
        technical_skills=', '.join(skills.get('technical', [])[:20]) or 'Not specified',
        soft_skills=', '.join(skills.get('soft', [])[:10]) or 'Not specified',
        certifications=', '.join(info.get('certifications', []) or []) or 'None',
        cv_summary=_build_cv_summary(cv_data) if cv_data else 'No CV data available',
        job_title=job_title or 'Not specified',
        job_company=job_company or 'Not specified',
        job_description=job_description[:3000] if job_description else 'Not provided',
        required_skills=_extract_required_skills(job_description or ''),
        experience_level=experience_level or 'Not specified',
        job_location=job_location or 'Not specified'
    )

    try:
        model = _get_gemini_model()
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.4,
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
        print(f"[InterviewCopilot] JSON parse error: {e}")
        traceback.print_exc()
        return _validate_and_fill({})

    except Exception as e:
        print(f"[InterviewCopilot] Generation error: {e}")
        traceback.print_exc()
        return _validate_and_fill({})


def generate_quick_interview_prep(cv_text, job_title, job_description):
    """Lightweight version when full CV data is not available."""
    minimal_cv = {
        'extracted_info': {
            'full_name': 'Candidate',
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
    return generate_interview_prep(minimal_cv, job_title, job_description)