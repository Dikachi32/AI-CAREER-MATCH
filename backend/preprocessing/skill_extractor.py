import re

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
    'opencv', 'nltk', 'spacy', 'huggingface', 'langchain', 'openai', 'pandas', 'numpy'
}

SOFT_SKILLS = {
    'leadership', 'communication', 'teamwork', 'collaboration', 'problem solving',
    'critical thinking', 'creativity', 'adaptability', 'time management', 'organization',
    'project management', 'agile', 'scrum', 'kanban', 'mentoring', 'presentation',
    'negotiation', 'conflict resolution', 'empathy', 'emotional intelligence',
    'decision making', 'analytical', 'detail oriented', 'self motivated', 'proactive',
    'multitasking', 'deadline driven', 'client facing', 'stakeholder management'
}

def extract_skills(text):
    text_lower = text.lower()
    words = set(re.findall(r'\b[a-z]+\b', text_lower))
    
    technical = list(TECHNICAL_SKILLS.intersection(words))
    soft = []
    
    for skill in SOFT_SKILLS:
        if skill in text_lower:
            soft.append(skill)
    
    # Also check for multi-word technical skills
    for skill in ['machine learning', 'deep learning', 'natural language processing',
                  'computer vision', 'data engineering', 'data science', 'devops',
                  'ci/cd', 'continuous integration', 'continuous deployment',
                  'microservices', 'serverless', 'blockchain', 'web3']:
        if skill in text_lower:
            if skill not in technical:
                technical.append(skill)
    
    return {
        'technical': list(set(technical)),
        'soft': list(set(soft))
    }