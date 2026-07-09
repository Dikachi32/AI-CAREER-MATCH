"""
Skill Extractor Module.
Primary mode: Returns structured skills from AIProfile (Gemini-extracted).
Fallback mode: Static keyword matching on raw text (backward compatibility).
"""

import re
from typing import Dict, List, Any, Optional

TECHNICAL_SKILLS = {
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
    'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'nosql', 'mongodb', 'postgresql',
    'mysql', 'sqlite', 'redis', 'elasticsearch', 'django', 'flask', 'fastapi', 'spring',
    'express', 'nestjs', 'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'jquery',
    'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'materialui', 'webpack',
    'vite', 'rollup', 'babel', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github',
    'aws', 'azure', 'gcp', 'firebase', 'heroku', 'terraform', 'ansible', 'puppet',
    'nginx', 'apache', 'linux', 'unix', 'bash', 'powershell', 'git', 'svn', 'mercurial',
    'jira', 'confluence', 'trello', 'slack', 'figma', 'sketch', 'adobe', 'photoshop',
    'illustrator', 'xd', 'premiere', 'aftereffects', 'blender', 'unity', 'unreal',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'scipy',
    'matplotlib', 'seaborn', 'plotly', 'd3', 'tableau', 'powerbi', 'spark', 'hadoop',
    'kafka', 'rabbitmq', 'celery', 'airflow', 'dbt', 'snowflake', 'bigquery', 'looker',
    'graphql', 'rest', 'soap', 'grpc', 'websocket', 'oauth', 'jwt', 'sso', 'ldap',
    'opencv', 'nltk', 'spacy', 'huggingface', 'langchain', 'openai'
}

SOFT_SKILLS = {
    'leadership', 'communication', 'teamwork', 'collaboration', 'problem solving',
    'critical thinking', 'creativity', 'adaptability', 'time management', 'organization',
    'project management', 'agile', 'scrum', 'kanban', 'mentoring', 'presentation',
    'negotiation', 'conflict resolution', 'empathy', 'emotional intelligence',
    'decision making', 'analytical', 'detail oriented', 'self motivated', 'proactive',
    'multitasking', 'deadline driven', 'client facing', 'stakeholder management'
}


def _fallback_extract_skills(text: str) -> Dict[str, List[str]]:
    """
    Legacy static keyword matching for fallback scenarios.
    """
    text_lower = text.lower()
    words = set(re.findall(r'\b[a-z]+\b', text_lower))

    technical = list(TECHNICAL_SKILLS.intersection(words))
    soft = []

    for skill in SOFT_SKILLS:
        if skill in text_lower:
            soft.append(skill)

    # Multi-word technical skills
    multi_word_skills = [
        'machine learning', 'deep learning', 'natural language processing',
        'computer vision', 'data engineering', 'data science', 'devops',
        'ci/cd', 'continuous integration', 'continuous deployment',
        'microservices', 'serverless', 'blockchain', 'web3'
    ]
    for skill in multi_word_skills:
        if skill in text_lower and skill not in technical:
            technical.append(skill)

    return {
        'technical': list(set(technical)),
        'soft': list(set(soft))
    }


def extract_skills(text: Optional[str] = None, ai_profile: Optional[Any] = None) -> Dict[str, List[str]]:
    """
    Extract skills using the best available source.

    Args:
        text: Raw CV text (fallback mode)
        ai_profile: AIProfile model instance (preferred mode)

    Returns:
        dict with 'technical' and 'soft' skill lists
    """
    # Primary path: Use Gemini-extracted structured skills from AIProfile
    if ai_profile is not None:
        technical = ai_profile.get_json_field('technical_skills') if hasattr(ai_profile, 'get_json_field') else []
        soft = ai_profile.get_json_field('soft_skills') if hasattr(ai_profile, 'get_json_field') else []

        # Ensure we return lists even if empty
        return {
            'technical': technical if isinstance(technical, list) else [],
            'soft': soft if isinstance(soft, list) else []
        }

    # Fallback path: Static keyword matching on raw text
    if text:
        return _fallback_extract_skills(text)

    # Ultimate fallback: empty structure
    return {'technical': [], 'soft': []}


def get_all_skills_flat(ai_profile: Optional[Any] = None, text: Optional[str] = None) -> List[str]:
    """
    Return a flat list of all skill names for job matching.
    """
    skills = extract_skills(text=text, ai_profile=ai_profile)
    return skills['technical'] + skills['soft']