"""
AI CV Optimization Engine
Analyzes job requirements, compares with CV, and generates optimized content.
"""

import re
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class OptimizationResult:
    optimized_summary: str
    target_role: str
    suggestions: List[str]
    keyword_matches: List[str]
    missing_keywords: List[str]
    ats_score_before: int
    ats_score_after: int


class CVOptimizerEngine:
    """
    AI-first CV optimization engine.
    Tailors CV content to match job requirements for ATS and human readers.
    """

    # Action verbs for professional rewriting
    ACTION_VERBS = [
        'Architected', 'Engineered', 'Developed', 'Designed', 'Implemented',
        'Optimized', 'Scaled', 'Led', 'Mentored', 'Delivered', 'Streamlined',
        'Automated', 'Refactored', 'Integrated', 'Deployed', 'Monitored'
    ]

    # ATS keywords by domain
    ATS_KEYWORDS = {
        'software engineer': ['agile', 'scrum', 'ci/cd', 'testing', 'api', 'microservices'],
        'data engineer': ['etl', 'pipeline', 'warehouse', 'spark', 'hadoop', 'sql'],
        'devops': ['infrastructure', 'automation', 'monitoring', 'cloud', 'security'],
        'machine learning': ['model', 'training', 'inference', 'deployment', 'feature engineering'],
        'frontend': ['responsive', 'accessibility', 'performance', 'state management', 'component'],
    }

    def optimize(self, cv_text: str, job_title: str, job_description: str) -> Dict:
        """
        Generate optimized CV content tailored to a specific job.
        """
        job_lower = f"{job_title} {job_description}".lower()
        cv_lower = cv_text.lower()

        # Extract job keywords
        job_keywords = self._extract_keywords(job_lower)

        # Extract CV keywords
        cv_keywords = self._extract_keywords(cv_lower)

        # Find matches and gaps
        matched = [k for k in job_keywords if k in cv_keywords]
        missing = [k for k in job_keywords if k not in cv_keywords]

        # Calculate ATS scores
        ats_before = self._calculate_ats_score(cv_keywords, job_keywords)
        ats_after = min(98, ats_before + len(missing) * 5 + 10)

        # Generate optimized summary
        optimized = self._generate_summary(cv_text, job_title, matched, missing)

        # Generate suggestions
        suggestions = self._generate_suggestions(missing, job_title, cv_text)

        return asdict(OptimizationResult(
            optimized_summary=optimized,
            target_role=job_title,
            suggestions=suggestions,
            keyword_matches=matched,
            missing_keywords=missing,
            ats_score_before=ats_before,
            ats_score_after=ats_after
        ))

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text."""
        # Technical keywords - using a simple word list instead of broken regex
        tech_keywords = [
            'python', 'javascript', 'typescript', 'java', 'go', 'golang', 'rust', 'c++', 'c#',
            'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'shell', 'bash',
            'react', 'reactjs', 'angular', 'vue', 'vuejs', 'svelte', 'nextjs', 'nuxtjs', 'gatsby',
            'node', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'laravel', 'rails',
            'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins',
            'github', 'gitlab', 'bitbucket', 'git', 'ci/cd', 'cicd', 'devops', 'mlops',
            'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
            'nosql', 'graphql', 'rest', 'api', 'microservices', 'serverless', 'lambda',
            'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'matplotlib',
            'machine learning', 'deep learning', 'nlp', 'computer vision', 'ai', 'data science',
            'agile', 'scrum', 'kanban', 'jira', 'confluence', 'figma', 'sketch', 'tableau',
            'powerbi', 'excel', 'word', 'powerpoint', 'photoshop', 'illustrator', 'xd',
            'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'material-ui',
            'webpack', 'vite', 'rollup', 'babel', 'eslint', 'prettier', 'jest', 'cypress',
            'selenium', 'junit', 'pytest', 'mocha', 'chai', 'cucumber', 'gatling',
            'kafka', 'rabbitmq', 'sqs', 'sns', 'event-driven', 'streaming',
            'oauth', 'jwt', 'sso', 'ldap', 'active directory', 'iam',
            'prometheus', 'grafana', 'datadog', 'new relic', 'splunk', 'elk',
            'hadoop', 'spark', 'hive', 'airflow', 'dbt', 'snowflake', 'bigquery',
            'linux', 'ubuntu', 'centos', 'debian', 'redhat', 'windows', 'macos',
            'nginx', 'apache', 'tomcat', 'iis', 'cdn', 'cloudfront', 'cloudflare'
        ]
        
        text_lower = text.lower()
        matches = []
        for keyword in tech_keywords:
            # Use word boundaries for single words, substring for multi-word
            if ' ' in keyword:
                if keyword in text_lower:
                    matches.append(keyword)
            else:
                # Check as whole word
                pattern = r'\b' + re.escape(keyword) + r'\b'
                if re.search(pattern, text_lower):
                    matches.append(keyword)
        
        return list(set(matches))[:20]

    def _calculate_ats_score(self, cv_keywords: List[str], job_keywords: List[str]) -> int:
        """Calculate ATS compatibility score."""
        if not job_keywords:
            return 50
        matches = len(set(cv_keywords) & set(job_keywords))
        return min(98, int((matches / len(job_keywords)) * 100))

    def _generate_summary(self, cv_text: str, job_title: str, matched: List[str], missing: List[str]) -> str:
        """Generate AI-optimized professional summary."""
        # Extract years of experience
        years_match = re.search(r'(\d+)\+?\s*years?', cv_text.lower())
        years = years_match.group(1) if years_match else 'several'

        # Extract current role using simple keyword matching
        role_keywords = [
            'software engineer', 'senior software engineer', 'lead software engineer',
            'full stack developer', 'backend developer', 'frontend developer',
            'devops engineer', 'data engineer', 'data scientist', 'machine learning engineer',
            'cloud engineer', 'site reliability engineer', 'mobile developer',
            'web developer', 'security engineer', 'network engineer', 'systems engineer',
            'database administrator', 'platform engineer', 'infrastructure engineer',
            'solutions architect', 'technical lead', 'engineering manager',
            'product manager', 'project manager', 'program manager', 'qa engineer',
            'test engineer', 'automation engineer', 'performance engineer',
            'data analyst', 'business analyst', 'business intelligence analyst',
            'research scientist', 'research engineer', 'applied scientist',
            'ai engineer', 'ml engineer', 'nlp engineer', 'computer vision engineer',
            'robotics engineer', 'blockchain developer', 'game developer',
            'embedded systems engineer', 'firmware engineer', 'hardware engineer',
            'ui engineer', 'ux engineer', 'frontend engineer', 'backend engineer',
            'site engineer', 'support engineer', 'sales engineer', 'pre-sales engineer',
            'consultant', 'freelancer', 'contractor', 'intern', 'trainee',
            'graduate engineer', 'junior engineer', 'associate engineer',
            'staff engineer', 'principal engineer', 'distinguished engineer',
            'fellow engineer', 'cto', 'cio', 'vp engineering', 'head of engineering',
            'director of engineering', 'chief architect', 'enterprise architect'
        ]
        
        current_role = 'Professional'
        cv_lower = cv_text.lower()
        for role in role_keywords:
            if role in cv_lower:
                current_role = role.title()
                break

        # Build optimized summary
        summary_parts = [
            f"Results-driven {current_role} with {years}+ years of experience",
        ]

        if matched:
            skill_str = ', '.join(matched[:5])
            summary_parts.append(f"Skilled in {skill_str}")

        if missing:
            gap_str = ', '.join(missing[:3])
            summary_parts.append(f"Currently expanding expertise in {gap_str}")

        summary_parts.append(f"Seeking to leverage technical depth and leadership in a {job_title} role")

        return '. '.join(summary_parts) + '.'

    def _generate_suggestions(self, missing: List[str], job_title: str, cv_text: str) -> List[str]:
        """Generate actionable improvement suggestions."""
        suggestions = [
            f"Highlight relevant experience with {job_title} technologies",
            "Quantify achievements with metrics and percentages",
            "Include keywords from the job description throughout your CV",
            "Structure your CV for ATS compatibility with clear headings"
        ]

        if missing:
            suggestions.append(f"Add experience with: {', '.join(missing[:5])}")

        # Check for metrics
        if not re.search(r'\d+%|\d+x|\$\d+|\d+\s*(?:users|customers|clients|requests|transactions)', cv_text):
            suggestions.append("Add measurable impact: e.g., 'Improved performance by 40%'")

        # Check for leadership
        if 'lead' not in cv_text.lower() and 'mentor' not in cv_text.lower():
            suggestions.append("Emphasize leadership and mentorship experience")

        return suggestions[:6]


# Singleton
_engine = None


def get_optimizer():
    global _engine
    if _engine is None:
        _engine = CVOptimizerEngine()
    return _engine


def optimize_cv(cv_text: str, job_title: str, job_description: str) -> Dict:
    engine = get_optimizer()
    return engine.optimize(cv_text, job_title, job_description)