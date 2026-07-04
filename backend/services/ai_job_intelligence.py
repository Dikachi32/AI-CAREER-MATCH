"""
AI Job Intelligence Engine
Generates intelligent insights about job postings and candidate fit.
"""

import re
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class JobIntelligence:
    hiring_expectations: str
    critical_success_factors: str
    competitiveness: str
    career_growth: str
    industry_insights: str
    strength_requirements: str
    role_difficulty: str
    career_progression: str


@dataclass
class CVMatchResult:
    match_percentage: int
    matched_skills: List[str]
    missing_skills: List[str]
    education_match: str
    experience_match: str
    ats_score: int
    recommendation: str
    explanation: str
    skills_match: bool


class AIJobIntelligenceEngine:
    """
    AI-first job intelligence engine.
    Analyzes job descriptions and generates strategic career insights.
    """

    # Seniority keywords for role analysis
    SENIORITY_KEYWORDS = {
        'entry': ['entry-level', 'junior', 'jr.', 'associate', 'intern', 'trainee', 'graduate', '0-2 years', '1-2 years'],
        'mid': ['mid-level', 'intermediate', '3-5 years', '2-5 years', 'experienced'],
        'senior': ['senior', 'sr.', 'lead', 'principal', 'staff', 'architect', 'head of', 'director', 'manager', '5+ years', '7+ years', '8+ years'],
        'executive': ['vp', 'vice president', 'cto', 'cio', 'chief', 'head of engineering', 'director of']
    }

    # Skill taxonomy for requirement extraction
    SKILL_PATTERNS = [
        r'(?:proficiency? in|experience with|knowledge of|familiar with|expertise in)\s+([A-Za-z0-9\s+#./]+?)(?:,|\.|;|$)',
        r'(?:required|must have|essential|mandatory).*?\b([A-Za-z0-9\s+#./]{3,40}?)\b',
        r'\b([A-Z][a-zA-Z0-9\s+#./]{2,30})\b(?=.*?(?:required|preferred|experience|skill))',
    ]

    def analyze_job(self, job_title: str, job_description: str, company: str = '', industry: str = '') -> Dict:
        """
        Generate comprehensive AI intelligence for a job posting.
        """
        text = f"{job_title} {job_description}".lower()
        title_lower = job_title.lower()

        # Determine seniority
        seniority = self._detect_seniority(text)

        # Extract key requirements
        requirements = self._extract_requirements(job_description)

        # Generate intelligence
        intelligence = JobIntelligence(
            hiring_expectations=self._generate_hiring_expectations(seniority, requirements, title_lower),
            critical_success_factors=self._generate_success_factors(requirements, seniority),
            competitiveness=self._generate_competitiveness(seniority, title_lower),
            career_growth=self._generate_career_growth(seniority, title_lower),
            industry_insights=self._generate_industry_insights(industry, title_lower),
            strength_requirements=self._generate_strength_requirements(requirements, seniority),
            role_difficulty=self._generate_role_difficulty(seniority, requirements),
            career_progression=self._generate_career_progression(seniority, title_lower)
        )

        return asdict(intelligence)

    def match_cv_to_job(self, cv_text: str, job_title: str, job_description: str,
                        user_skills: List[str]) -> Dict:
        """
        Compare CV against job requirements and generate match analysis.
        """
        text = f"{job_title} {job_description}".lower()
        cv_lower = cv_text.lower()

        # Extract job requirements
        job_skills = self._extract_skills_from_text(text)

        # Calculate matches
        matched = [s for s in user_skills if s.lower() in text or any(s.lower() in js for js in job_skills)]
        missing = [js for js in job_skills if js not in [s.lower() for s in user_skills]]

        # Calculate match percentage
        total_required = len(job_skills) if job_skills else 10
        match_pct = min(98, int((len(matched) / max(total_required, 1)) * 100) + 20)

        # Education match
        education_match = self._check_education_match(cv_lower, text)

        # Experience match
        experience_match = self._check_experience_match(cv_lower, text)

        # ATS score
        ats_score = self._calculate_ats_score(cv_lower, text, matched)

        # Recommendation
        recommendation, explanation = self._generate_recommendation(
            match_pct, len(missing), education_match, experience_match
        )

        return asdict(CVMatchResult(
            match_percentage=match_pct,
            matched_skills=matched[:10],
            missing_skills=missing[:10],
            education_match=education_match,
            experience_match=experience_match,
            ats_score=ats_score,
            recommendation=recommendation,
            explanation=explanation,
            skills_match=len(missing) <= 3
        ))

    def _detect_seniority(self, text: str) -> str:
        for level, keywords in self.SENIORITY_KEYWORDS.items():
            for kw in keywords:
                if kw in text:
                    return level
        return 'mid'

    def _extract_requirements(self, description: str) -> List[str]:
        requirements = []
        for pattern in self.SKILL_PATTERNS:
            matches = re.findall(pattern, description, re.IGNORECASE)
            for match in matches:
                clean = match.strip().lower()
                if len(clean) > 2 and clean not in requirements:
                    requirements.append(clean)
        return requirements[:15]

    def _extract_skills_from_text(self, text: str) -> List[str]:
        common_skills = [
            'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++', 'c#', 'ruby', 'php',
            'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'html', 'css', 'sass', 'tailwind',
            'node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'nestjs',
            'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible',
            'git', 'github', 'gitlab', 'ci/cd', 'agile', 'scrum', 'jira',
            'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
            'graphql', 'rest api', 'microservices', 'serverless', 'lambda',
            'linux', 'bash', 'powershell', 'nginx', 'apache'
        ]
        found = [skill for skill in common_skills if skill in text]
        return found

    def _generate_hiring_expectations(self, seniority: str, requirements: List[str], title: str) -> str:
        expectations = {
            'entry': "Employers expect foundational knowledge, strong learning aptitude, and enthusiasm. Focus on academic projects, internships, and transferable skills.",
            'mid': "Employers expect demonstrated expertise, independent execution, and some mentorship capability. Showcase production experience and measurable impact.",
            'senior': "Employers expect architectural thinking, cross-team leadership, and deep technical mastery. Emphasize system design, mentoring, and strategic contributions.",
            'executive': "Employers expect vision, organizational impact, and business-technical alignment. Focus on scale, transformation, and leadership outcomes."
        }
        return expectations.get(seniority, expectations['mid'])

    def _generate_success_factors(self, requirements: List[str], seniority: str) -> str:
        factors = [
            "Demonstrate hands-on experience with core technologies",
            "Show measurable impact from past projects",
            "Communicate complex ideas clearly",
            "Display cultural alignment and team collaboration"
        ]
        if seniority in ['senior', 'executive']:
            factors.extend([
                "Evidence of architectural decision-making",
                "Track record of mentoring and elevating teams",
                "Experience scaling systems or teams"
            ])
        return " • ".join(factors)

    def _generate_competitiveness(self, seniority: str, title: str) -> str:
        competitive_map = {
            'entry': "High competition with many graduates. Differentiate with personal projects, certifications, and open-source contributions.",
            'mid': "Moderate competition. Stand out with specialized expertise, leadership in projects, and clear career progression.",
            'senior': "Selective market. Differentiate with thought leadership, speaking engagements, and proven scale experience.",
            'executive': "Very selective. Network and reputation are critical. Executive search firms often drive these placements."
        }
        return competitive_map.get(seniority, competitive_map['mid'])

    def _generate_career_growth(self, seniority: str, title: str) -> str:
        growth_map = {
            'entry': "Clear path to mid-level within 2-3 years. Focus on skill breadth and cross-functional exposure.",
            'mid': "Path to senior roles in 3-5 years. Develop specialization and begin mentoring others.",
            'senior': "Path to Staff/Principal or Engineering Management. Choose technical depth or people leadership.",
            'executive': "C-suite or board opportunities. Focus on business impact and organizational transformation."
        }
        return growth_map.get(seniority, growth_map['mid'])

    def _generate_industry_insights(self, industry: str, title: str) -> str:
        base = "The technology sector shows sustained demand for this role."
        if 'ai' in title or 'machine learning' in title or 'data' in title:
            return f"{base} AI/ML roles are experiencing 35% YoY growth with significant talent shortages."
        if 'security' in title or 'devops' in title or 'cloud' in title:
            return f"{base} Cloud and security roles remain critically understaffed with premium compensation."
        if 'frontend' in title or 'react' in title or 'mobile' in title:
            return f"{base} Frontend and mobile development remains highly competitive with strong remote opportunities."
        return f"{base} Full-stack and backend roles continue to see robust hiring across all company sizes."

    def _generate_strength_requirements(self, requirements: List[str], seniority: str) -> str:
        core = "Technical depth, problem-solving under ambiguity, and effective communication"
        if seniority in ['senior', 'executive']:
            core += ". Additionally: systems thinking, stakeholder management, and strategic technical decision-making"
        return core

    def _generate_role_difficulty(self, seniority: str, requirements: List[str]) -> str:
        difficulty = {
            'entry': "Low to moderate. Focus on fundamentals and eagerness to learn.",
            'mid': "Moderate. Requires proven track record and some specialization.",
            'senior': "High. Expects architectural decisions and cross-org impact.",
            'executive': "Very high. Demands business acumen and transformation leadership."
        }
        return difficulty.get(seniority, difficulty['mid'])

    def _generate_career_progression(self, seniority: str, title: str) -> str:
        progression = {
            'entry': "Build a strong GitHub portfolio, contribute to open source, earn cloud certifications.",
            'mid': "Lead a significant project, mentor juniors, develop deep expertise in one domain.",
            'senior': "Publish technical articles, speak at conferences, drive org-wide initiatives.",
            'executive': "Build external presence, join advisory boards, develop P&L responsibility."
        }
        return progression.get(seniority, progression['mid'])

    def _check_education_match(self, cv_lower: str, job_text: str) -> str:
        edu_keywords = ['bachelor', 'master', 'phd', 'degree', 'bs', 'ms', 'ba', 'computer science', 'engineering']
        has_edu = any(kw in cv_lower for kw in edu_keywords)
        requires_edu = any(kw in job_text for kw in ['degree required', 'bachelor required', 'master preferred'])
        if has_edu:
            return 'Strong' if requires_edu else 'Good'
        return 'Needs Improvement' if requires_edu else 'Adequate'

    def _check_experience_match(self, cv_lower: str, job_text: str) -> str:
        # Extract years from job
        job_years = re.findall(r'(\d+)\+?\s*years?', job_text)
        req_years = max([int(y) for y in job_years] or [0])

        # Extract years from CV
        cv_years = re.findall(r'(\d+)\+?\s*years?\s*(?:of\s*)?experience', cv_lower)
        user_years = max([int(y) for y in cv_years] or [0])

        if user_years >= req_years:
            return 'Strong'
        elif user_years >= req_years * 0.7:
            return 'Good'
        return 'Needs Improvement'

    def _calculate_ats_score(self, cv_lower: str, job_text: str, matched_skills: List[str]) -> int:
        base_score = 50
        base_score += len(matched_skills) * 5
        if 'summary' in cv_lower or 'profile' in cv_lower:
            base_score += 10
        if 'experience' in cv_lower:
            base_score += 10
        if 'education' in cv_lower:
            base_score += 10
        if 'skills' in cv_lower:
            base_score += 10
        return min(98, base_score)


# Singleton
_engine = None


def get_intelligence_engine():
    global _engine
    if _engine is None:
        _engine = AIJobIntelligenceEngine()
    return _engine


def analyze_job_intelligence(job_title: str, job_description: str, company: str = '', industry: str = '') -> Dict:
    engine = get_intelligence_engine()
    return engine.analyze_job(job_title, job_description, company, industry)


def match_cv_to_job(cv_text: str, job_title: str, job_description: str, user_skills: List[str]) -> Dict:
    engine = get_intelligence_engine()
    return engine.match_cv_to_job(cv_text, job_title, job_description, user_skills)