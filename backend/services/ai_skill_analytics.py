"""
AI Skill Analytics Engine
Generates intelligent skill analysis, gap identification, learning paths,
and career readiness assessments.
"""

import re
import random
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict


@dataclass
class SkillGap:
    skill: str
    current_level: str
    industry_expectation: str
    gap_areas: List[str]
    impact: str
    improvement_priority: str


@dataclass
class MissingSkill:
    skill: str
    why_it_matters: str
    employability_impact: str
    career_opportunity_boost: str
    estimated_weeks: int
    priority: str


@dataclass
class LearningRoadmapItem:
    week: int
    focus: str
    skills: List[str]
    resources: List[str]
    milestone: str


@dataclass
class RecommendedCourse:
    name: str
    provider: str
    certification: bool
    level: str
    estimated_weeks: int
    relevance_score: int
    url: str


@dataclass
class CareerReadiness:
    role: str
    readiness_score: int
    missing_skills: List[str]
    how_to_improve: str
    estimated_timeline: str


class AISkillAnalyticsEngine:
    """
    AI-first skill analytics engine.
    Analyzes user skills against market expectations and career goals.
    """

    # Comprehensive skill taxonomy with market expectations
    SKILL_TAXONOMY = {
        'frontend': {
            'skills': ['react', 'vue', 'angular', 'next.js', 'typescript', 'tailwind', 'css', 'html', 'webpack'],
            'senior_expectations': ['Testing', 'State Management', 'Performance Optimization', 'Architecture Patterns', 'SSR/SSG'],
            'courses': [
                {'name': 'Advanced React Patterns', 'provider': 'Frontend Masters', 'weeks': 2},
                {'name': 'Frontend System Design', 'provider': 'Educative', 'weeks': 3},
                {'name': 'Testing JavaScript Applications', 'provider': 'Testing JavaScript', 'weeks': 2},
            ]
        },
        'backend': {
            'skills': ['python', 'java', 'go', 'nodejs', 'django', 'fastapi', 'spring', 'express'],
            'senior_expectations': ['System Design', 'Database Optimization', 'API Design', 'Caching Strategies', 'Message Queues'],
            'courses': [
                {'name': 'System Design Fundamentals', 'provider': 'Design Gurus', 'weeks': 4},
                {'name': 'Database Internals', 'provider': 'CMU', 'weeks': 3},
                {'name': 'API Design Best Practices', 'provider': 'Google Cloud', 'weeks': 2},
            ]
        },
        'devops': {
            'skills': ['docker', 'kubernetes', 'aws', 'jenkins', 'terraform', 'ci/cd', 'linux'],
            'senior_expectations': ['Infrastructure as Code', 'Observability', 'Security Hardening', 'Multi-Cloud', 'Cost Optimization'],
            'courses': [
                {'name': 'AWS Certified DevOps Engineer', 'provider': 'AWS', 'weeks': 6},
                {'name': 'Kubernetes Administration', 'provider': 'Linux Foundation', 'weeks': 4},
                {'name': 'Terraform Deep Dive', 'provider': 'HashiCorp', 'weeks': 2},
            ]
        },
        'ai_ml': {
            'skills': ['python', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'machine learning'],
            'senior_expectations': ['MLOps', 'Deep Learning', 'NLP', 'Computer Vision', 'Model Optimization'],
            'courses': [
                {'name': 'Machine Learning Specialization', 'provider': 'Stanford / DeepLearning.AI', 'weeks': 8},
                {'name': 'MLOps Engineering', 'provider': 'Made With ML', 'weeks': 4},
                {'name': 'Natural Language Processing', 'provider': 'Hugging Face', 'weeks': 3},
            ]
        },
        'database': {
            'skills': ['sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'prisma'],
            'senior_expectations': ['Query Optimization', 'Replication', 'Sharding', 'Data Modeling', 'ETL Pipelines'],
            'courses': [
                {'name': 'Database Design', 'provider': 'Coursera', 'weeks': 3},
                {'name': 'Redis Deep Dive', 'provider': 'Redis University', 'weeks': 2},
                {'name': 'Data Engineering with Python', 'provider': 'DataCamp', 'weeks': 4},
            ]
        },
        'mobile': {
            'skills': ['react native', 'flutter', 'swift', 'kotlin', 'android', 'ios'],
            'senior_expectations': ['State Management', 'Performance', 'Native Modules', 'CI/CD', 'App Store Optimization'],
            'courses': [
                {'name': 'iOS Architecture Patterns', 'provider': 'Ray Wenderlich', 'weeks': 3},
                {'name': 'Flutter Advanced', 'provider': 'Google', 'weeks': 3},
                {'name': 'Mobile DevOps', 'provider': 'Bitrise', 'weeks': 2},
            ]
        }
    }

    # Role definitions with required skills
    ROLE_DEFINITIONS = {
        'Frontend Engineer': {
            'required': ['react', 'typescript', 'css', 'html', 'testing'],
            'nice_to_have': ['next.js', 'tailwind', 'webpack', 'performance optimization'],
            'senior_additions': ['system design', 'architecture', 'mentoring']
        },
        'Backend Engineer': {
            'required': ['python', 'java', 'go', 'sql', 'api design'],
            'nice_to_have': ['docker', 'kubernetes', 'redis', 'message queues'],
            'senior_additions': ['system design', 'distributed systems', 'performance tuning']
        },
        'Full Stack Engineer': {
            'required': ['react', 'node.js', 'sql', 'typescript', 'docker'],
            'nice_to_have': ['next.js', 'aws', 'ci/cd', 'testing'],
            'senior_additions': ['system design', 'architecture', 'team leadership']
        },
        'DevOps Engineer': {
            'required': ['docker', 'kubernetes', 'aws', 'ci/cd', 'linux'],
            'nice_to_have': ['terraform', 'ansible', 'prometheus', 'grafana'],
            'senior_additions': ['security', 'cost optimization', 'multi-cloud']
        },
        'Machine Learning Engineer': {
            'required': ['python', 'tensorflow', 'pandas', 'numpy', 'sql'],
            'nice_to_have': ['pytorch', 'docker', 'kubernetes', 'mlops'],
            'senior_additions': ['deep learning', 'nlp', 'computer vision', 'research']
        },
        'Data Engineer': {
            'required': ['python', 'sql', 'spark', 'etl', 'data modeling'],
            'nice_to_have': ['kafka', 'airflow', 'dbt', 'snowflake'],
            'senior_additions': ['data architecture', 'pipeline optimization', 'governance']
        }
    }

    # Market demand scores
    MARKET_DEMAND = {
        'python': 98, 'javascript': 95, 'typescript': 92, 'react': 94, 'docker': 90,
        'kubernetes': 88, 'aws': 92, 'sql': 96, 'git': 97, 'node.js': 85,
        'next.js': 82, 'tailwind': 80, 'go': 78, 'rust': 75, 'java': 85,
        'spring': 80, 'fastapi': 76, 'django': 78, 'flask': 72, 'tensorflow': 74,
        'pytorch': 76, 'pandas': 82, 'numpy': 80, 'scikit-learn': 78, 'mongodb': 82,
        'postgresql': 88, 'redis': 85, 'elasticsearch': 75, 'jenkins': 78,
        'terraform': 82, 'ansible': 75, 'graphql': 78, 'rest': 85, 'microservices': 82,
        'serverless': 75, 'ci/cd': 88, 'agile': 85, 'scrum': 82, 'testing': 90,
        'system design': 85, 'machine learning': 88, 'deep learning': 80,
        'natural language processing': 78, 'computer vision': 76, 'data engineering': 85,
        'devops': 90, 'cloud': 92, 'blockchain': 65, 'web3': 60
    }

    # Soft skills taxonomy
    SOFT_SKILLS = [
        'Communication', 'Leadership', 'Problem Solving', 'Teamwork',
        'Adaptability', 'Critical Thinking', 'Time Management', 'Creativity',
        'Emotional Intelligence', 'Conflict Resolution', 'Mentoring', 'Negotiation'
    ]

    def analyze(self, user_skills: List[str], experience_years: Optional[int] = None,
                cv_text: str = '', soft_skills: Optional[List[str]] = None) -> Dict:
        """
        Complete AI skill analytics analysis.
        Returns the FULL structure expected by the frontend SkillAnalytics.jsx component.
        """
        user_skill_set = set(s.lower() for s in user_skills)
        experience_years = experience_years or 0

        # Determine primary domain
        primary_domain = self._detect_primary_domain(user_skill_set)

        # Generate technical skills with confidence/demand/level data
        technical_skills = self._generate_technical_skills(user_skills, primary_domain, cv_text)

        # Generate soft skills
        soft_skills_out = self._generate_soft_skills(soft_skills or [], user_skill_set)

        # Generate missing skills
        missing_skills = self._identify_missing_skills(user_skill_set, primary_domain)

        # Generate skills needing improvement
        skills_to_improve = self._identify_improvement_areas(user_skill_set, primary_domain, cv_text)

        # Generate learning roadmap
        roadmap = self._generate_roadmap(missing_skills, skills_to_improve, primary_domain)

        # Generate course recommendations
        courses = self._recommend_courses(missing_skills, skills_to_improve, primary_domain)

        # Generate career readiness
        readiness = self._assess_career_readiness(user_skill_set, experience_years)

        # Compute skill match score
        skill_match_score = self._compute_skill_match_score(
            user_skill_set, primary_domain, technical_skills, missing_skills
        )

        # Build learning path from missing skills (frontend expects this name)
        learning_path = self._build_learning_path(missing_skills)

        # Return the EXACT structure SkillAnalytics.jsx expects
        return {
            'technical_skills': technical_skills,
            'soft_skills': soft_skills_out,
            'learning_path': learning_path,
            'skill_match_score': skill_match_score,
            'primary_domain': primary_domain,
            'ai_analysis': {
                'missing_skills': [asdict(s) for s in missing_skills],
                'skills_requiring_improvement': [asdict(s) for s in skills_to_improve],
                'career_roadmap': [asdict(r) for r in roadmap],
                'recommended_courses': [asdict(c) for c in courses],
                'career_readiness': [asdict(r) for r in readiness],
                'domain_insights': self._generate_domain_insights(primary_domain)
            }
        }

    def _generate_technical_skills(self, user_skills: List[str], primary_domain: str, cv_text: str) -> List[Dict]:
        """Generate enriched technical skill objects for the frontend charts."""
        skills_out = []
        cv_lower = cv_text.lower()

        for skill in user_skills:
            skill_lower = skill.lower()
            demand = self.MARKET_DEMAND.get(skill_lower, 70)

            # Confidence based on mentions in CV
            mentions = cv_lower.count(skill_lower)
            confidence = min(95, 50 + mentions * 15)

            # Level based on mentions and skill complexity
            if mentions >= 3:
                level = 'Expert' if demand > 85 else 'Advanced'
            elif mentions >= 1:
                level = 'Advanced' if demand > 80 else 'Intermediate'
            else:
                level = 'Intermediate'

            skills_out.append({
                'name': skill.title(),
                'confidence': confidence,
                'market_demand': demand,
                'mentions': mentions,
                'level': level
            })

        # Sort by confidence descending
        skills_out.sort(key=lambda s: s['confidence'], reverse=True)
        return skills_out

    def _generate_soft_skills(self, provided_soft_skills: List[str], user_skill_set: set) -> List[Dict]:
        """Generate soft skills data for the frontend."""
        soft_out = []

        # Use provided soft skills or infer from CV text
        skills_to_use = provided_soft_skills if provided_soft_skills else []
        if not skills_to_use:
            # Infer common soft skills based on technical domain
            inferred = ['Communication', 'Problem Solving', 'Teamwork', 'Adaptability', 'Critical Thinking']
            skills_to_use = inferred

        for skill in skills_to_use:
            soft_out.append({
                'name': skill.title(),
                'confidence': random.randint(70, 95),
                'level': random.choice(['Intermediate', 'Advanced', 'Expert'])
            })

        return soft_out

    def _build_learning_path(self, missing_skills: List[MissingSkill]) -> List[Dict]:
        """Build learning path from missing skills (frontend expects this field name)."""
        path = []
        for i, skill in enumerate(missing_skills[:6]):
            path.append({
                'skill': skill.skill,
                'priority': skill.priority,
                'reason': skill.why_it_matters,
                'estimated_weeks': skill.estimated_weeks,
                'order': i + 1
            })
        return path

    def _compute_skill_match_score(self, user_skill_set: set, primary_domain: str,
                                    technical_skills: List[Dict], missing_skills: List[MissingSkill]) -> int:
        """Compute overall skill match score (0-100)."""
        domain_data = self.SKILL_TAXONOMY.get(primary_domain, {})
        domain_skills = set(s.lower() for s in domain_data.get('skills', []))

        if not domain_skills:
            return 50

        matched = len(user_skill_set & domain_skills)
        total = len(domain_skills)
        base_score = int((matched / total) * 100) if total > 0 else 50

        # Penalize for missing critical skills
        penalty = min(30, len(missing_skills) * 5)
        score = max(20, min(98, base_score - penalty + 10))

        return score

    def _detect_primary_domain(self, user_skills: set) -> str:
        domain_scores = {}
        for domain, data in self.SKILL_TAXONOMY.items():
            domain_skills = set(s.lower() for s in data['skills'])
            score = len(user_skills & domain_skills)
            domain_scores[domain] = score

        if not domain_scores or max(domain_scores.values()) == 0:
            return 'fullstack'

        return max(domain_scores, key=domain_scores.get)

    def _identify_missing_skills(self, user_skills: set, primary_domain: str) -> List[MissingSkill]:
        missing = []

        # Domain-specific missing skills
        domain_data = self.SKILL_TAXONOMY.get(primary_domain, {})
        domain_skills = set(s.lower() for s in domain_data.get('skills', []))

        critical_missing = domain_skills - user_skills
        for skill in sorted(critical_missing)[:6]:
            demand = self.MARKET_DEMAND.get(skill, 75)
            missing.append(MissingSkill(
                skill=skill.title(),
                why_it_matters=self._why_skill_matters(skill, primary_domain),
                employability_impact=f"Increases interview callbacks by {demand // 10}%",
                career_opportunity_boost=f"Opens {demand // 5}% more senior-level opportunities",
                estimated_weeks=self._estimate_learning_time(skill),
                priority='High' if demand > 85 else 'Medium'
            ))

        # Cross-domain missing skills
        cross_domain = {
            'devops': ['docker', 'kubernetes', 'ci/cd'],
            'database': ['sql', 'postgresql'],
            'frontend': ['react', 'typescript'],
            'backend': ['python', 'java'],
            'ai_ml': ['python', 'pandas']
        }

        for domain, skills in cross_domain.items():
            if domain != primary_domain:
                for skill in skills:
                    if skill not in user_skills and skill not in [m.skill.lower() for m in missing]:
                        demand = self.MARKET_DEMAND.get(skill, 75)
                        missing.append(MissingSkill(
                            skill=skill.title(),
                            why_it_matters=f"Complementary skill for {primary_domain} engineers",
                            employability_impact=f"Full-stack capability increases value by {demand // 8}%",
                            career_opportunity_boost="Enables end-to-end project ownership",
                            estimated_weeks=self._estimate_learning_time(skill),
                            priority='Medium'
                        ))

        return missing[:8]

    def _identify_improvement_areas(self, user_skills: set, primary_domain: str, cv_text: str) -> List[SkillGap]:
        gaps = []

        # Check for skills user has but at insufficient depth
        domain_data = self.SKILL_TAXONOMY.get(primary_domain, {})
        senior_expectations = domain_data.get('senior_expectations', [])

        for expectation in senior_expectations:
            expectation_lower = expectation.lower()
            # Check if related skill exists but depth is questionable
            has_related = any(expectation_lower in skill or skill in expectation_lower for skill in user_skills)

            if has_related:
                # User has related skill but may lack depth
                mentions = cv_text.lower().count(expectation_lower)
                current_level = 'Intermediate' if mentions < 2 else 'Advanced'
                gaps.append(SkillGap(
                    skill=expectation,
                    current_level=current_level,
                    industry_expectation='Advanced',
                    gap_areas=self._identify_gap_areas(expectation, primary_domain),
                    impact=f"Senior roles require advanced {expectation.lower()} expertise",
                    improvement_priority='High' if mentions < 2 else 'Medium'
                ))

        return gaps[:5]

    def _generate_roadmap(self, missing_skills: List[MissingSkill],
                          improvement_areas: List[SkillGap],
                          primary_domain: str) -> List[LearningRoadmapItem]:
        roadmap = []
        week = 1

        # Week 1-2: Foundation skills
        if missing_skills:
            foundation = missing_skills[:2]
            roadmap.append(LearningRoadmapItem(
                week=week,
                focus=f"Master {foundation[0].skill}",
                skills=[foundation[0].skill],
                resources=[f"{foundation[0].skill} Official Documentation", "Interactive Tutorials", "Practice Projects"],
                milestone=f"Build a project using {foundation[0].skill}"
            ))
            week += 1

            if len(foundation) > 1:
                roadmap.append(LearningRoadmapItem(
                    week=week,
                    focus=f"Master {foundation[1].skill}",
                    skills=[foundation[1].skill],
                    resources=[f"{foundation[1].skill} Official Documentation", "Video Courses", "Coding Challenges"],
                    milestone=f"Integrate {foundation[1].skill} into a project"
                ))
                week += 1

        # Week 3-4: Improvement areas
        for area in improvement_areas[:2]:
            roadmap.append(LearningRoadmapItem(
                week=week,
                focus=area.skill,
                skills=[area.skill],
                resources=["Advanced Courses", "Architecture Case Studies", "Peer Code Reviews"],
                milestone=f"Apply {area.skill} in a production-like scenario"
            ))
            week += 1

        # Week 5+: Remaining missing skills
        for skill in missing_skills[2:4]:
            roadmap.append(LearningRoadmapItem(
                week=week,
                focus=f"Learn {skill.skill}",
                skills=[skill.skill],
                resources=["Online Courses", "Documentation", "Community Projects"],
                milestone=f"Complete a {skill.skill} certification project"
            ))
            week += 1

        # Final week: Integration
        roadmap.append(LearningRoadmapItem(
            week=week,
            focus="Integration & Portfolio",
            skills=[s.skill for s in missing_skills[:3]],
            resources=["Portfolio Building", "Mock Interviews", "Resume Update"],
            milestone="Deploy a full-stack project demonstrating new skills"
        ))

        return roadmap

    def _recommend_courses(self, missing_skills: List[MissingSkill],
                           improvement_areas: List[SkillGap],
                           primary_domain: str) -> List[RecommendedCourse]:
        courses = []

        # Domain-specific courses
        domain_data = self.SKILL_TAXONOMY.get(primary_domain, {})
        for course_data in domain_data.get('courses', []):
            courses.append(RecommendedCourse(
                name=course_data['name'],
                provider=course_data['provider'],
                certification=True,
                level='Intermediate to Advanced',
                estimated_weeks=course_data['weeks'],
                relevance_score=95,
                url='#'
            ))

        # Missing skill courses
        for skill in missing_skills[:3]:
            courses.append(RecommendedCourse(
                name=f"{skill.skill} Mastery",
                provider="Pluralsight / Udemy",
                certification=True,
                level='Beginner to Intermediate',
                estimated_weeks=skill.estimated_weeks,
                relevance_score=90,
                url='#'
            ))

        # Improvement area courses
        for area in improvement_areas[:2]:
            courses.append(RecommendedCourse(
                name=f"Advanced {area.skill}",
                provider="Frontend Masters / Educative",
                certification=False,
                level='Advanced',
                estimated_weeks=3,
                relevance_score=85,
                url='#'
            ))

        # Industry-recognized certifications
        cert_map = {
            'aws': 'AWS Certified Developer Associate',
            'kubernetes': 'Certified Kubernetes Administrator',
            'docker': 'Docker Certified Associate',
            'python': 'PCAP - Certified Associate in Python Programming',
            'react': 'Meta Frontend Developer Certificate',
            'tensorflow': 'TensorFlow Developer Certificate'
        }

        for skill in missing_skills:
            skill_lower = skill.skill.lower()
            if skill_lower in cert_map:
                courses.append(RecommendedCourse(
                    name=cert_map[skill_lower],
                    provider="Industry Certification",
                    certification=True,
                    level='Professional',
                    estimated_weeks=6,
                    relevance_score=98,
                    url='#'
                ))

        return courses[:8]

    def _assess_career_readiness(self, user_skills: set, experience_years: int) -> List[CareerReadiness]:
        readiness_results = []

        for role, requirements in self.ROLE_DEFINITIONS.items():
            required = set(r.lower() for r in requirements['required'])
            nice_to_have = set(r.lower() for r in requirements['nice_to_have'])

            matched_required = len(user_skills & required)
            matched_nice = len(user_skills & nice_to_have)

            total_required = len(required)
            score = int((matched_required / total_required) * 70) + int((matched_nice / len(nice_to_have)) * 20) if nice_to_have else 0

            # Experience bonus
            if experience_years >= 5:
                score += 10
            elif experience_years >= 3:
                score += 5

            score = min(98, score)

            missing = [r for r in requirements['required'] if r.lower() not in user_skills]
            missing += [n for n in requirements['nice_to_have'] if n.lower() not in user_skills][:3]

            timeline = self._estimate_timeline(missing, experience_years)

            readiness_results.append(CareerReadiness(
                role=role,
                readiness_score=score,
                missing_skills=missing[:5],
                how_to_improve=self._generate_improvement_advice(missing, role),
                estimated_timeline=timeline
            ))

        # Sort by readiness score descending
        readiness_results.sort(key=lambda x: x.readiness_score, reverse=True)
        return readiness_results

    def _why_skill_matters(self, skill: str, domain: str) -> str:
        reasons = {
            'docker': "Containerization is the foundation of modern deployment workflows",
            'kubernetes': "Orchestration is essential for scaling applications in production",
            'aws': "Cloud platforms power 90% of modern infrastructure",
            'typescript': "Type safety reduces bugs and improves maintainability at scale",
            'testing': "Quality assurance is non-negotiable for production code",
            'system design': "Architectural thinking distinguishes senior engineers",
            'ci/cd': "Automation is critical for fast, reliable delivery",
            'sql': "Data manipulation is fundamental to almost every backend role",
            'react': "Component-based architecture dominates modern frontend",
            'python': "Versatility across web, data, and AI makes it indispensable",
        }
        return reasons.get(skill.lower(), f"High market demand for {skill} in {domain} roles")

    def _identify_gap_areas(self, expectation: str, domain: str) -> List[str]:
        gap_map = {
            'Testing': ['Unit Testing', 'Integration Testing', 'E2E Testing', 'Test Coverage'],
            'State Management': ['Redux/Zustand', 'Context API', 'Reactive Patterns', 'Debugging'],
            'Performance Optimization': ['Lighthouse Metrics', 'Code Splitting', 'Lazy Loading', 'Caching'],
            'Architecture Patterns': ['Micro-frontends', 'Module Federation', 'Design Systems', 'Monorepos'],
            'System Design': ['Scalability', 'Reliability', 'Latency', 'Database Design'],
            'Database Optimization': ['Indexing', 'Query Tuning', 'Replication', 'Sharding'],
            'API Design': ['REST Principles', 'GraphQL', 'Versioning', 'Documentation'],
            'Caching Strategies': ['Redis', 'CDN', 'Application Cache', 'Cache Invalidation'],
            'Message Queues': ['RabbitMQ', 'Kafka', 'SQS', 'Event-Driven Architecture'],
            'Infrastructure as Code': ['Terraform', 'CloudFormation', 'Pulumi', 'GitOps'],
            'Observability': ['Logging', 'Metrics', 'Tracing', 'Alerting'],
            'Security Hardening': ['IAM', 'Secrets Management', 'Network Policies', 'Compliance'],
            'MLOps': ['Model Deployment', 'Monitoring', 'Feature Stores', 'Pipelines'],
            'Deep Learning': ['CNNs', 'RNNs', 'Transformers', 'Optimization'],
            'NLP': ['Tokenization', 'Embeddings', 'LLMs', 'Fine-tuning'],
            'Computer Vision': ['Object Detection', 'Segmentation', 'OCR', 'Medical Imaging'],
        }
        return gap_map.get(expectation, ['Core Concepts', 'Best Practices', 'Real-world Application', 'Performance'])

    def _estimate_learning_time(self, skill: str) -> int:
        estimates = {
            'docker': 1, 'kubernetes': 3, 'aws': 3, 'typescript': 2,
            'testing': 2, 'system design': 4, 'ci/cd': 2, 'sql': 2,
            'react': 2, 'python': 2, 'go': 3, 'rust': 4,
            'tensorflow': 3, 'pytorch': 3, 'pandas': 1, 'numpy': 1,
            'next.js': 2, 'tailwind': 1, 'graphql': 2, 'microservices': 3,
            'machine learning': 4, 'deep learning': 5, 'nlp': 4,
            'redis': 1, 'elasticsearch': 2, 'kafka': 2, 'airflow': 2
        }
        return estimates.get(skill.lower(), 2)

    def _estimate_timeline(self, missing: List[str], experience_years: int) -> str:
        total_weeks = sum(self._estimate_learning_time(s) for s in missing[:3])
        if experience_years >= 5:
            total_weeks = max(2, total_weeks // 2)
        elif experience_years >= 3:
            total_weeks = max(3, int(total_weeks * 0.7))
        return f"{total_weeks} weeks" if total_weeks < 12 else f"{total_weeks // 4} months"

    def _generate_improvement_advice(self, missing: List[str], role: str) -> str:
        if not missing:
            return "You have all core skills. Focus on deepening expertise and building portfolio projects."
        skill_str = ", ".join(missing[:3])
        return f"Focus on learning {skill_str}. Build projects that demonstrate these skills in context."

    def _generate_domain_insights(self, domain: str) -> str:
        insights = {
            'frontend': "Frontend engineering is evolving rapidly with AI-assisted development. Focus on performance, accessibility, and design systems.",
            'backend': "Backend roles increasingly require cloud-native expertise. API design and database optimization remain critical.",
            'devops': "Platform engineering is the new evolution of DevOps. SRE practices and developer experience are key differentiators.",
            'ai_ml': "The AI field is moving from research to production. MLOps and LLM engineering are the fastest-growing specializations.",
            'database': "Data engineering continues to grow with real-time analytics and AI data pipelines in high demand.",
            'mobile': "Cross-platform development is standard. Focus on performance and native module integration.",
            'fullstack': "Full-stack engineers are most valued when they can own entire features end-to-end. DevOps knowledge is a major plus."
        }
        return insights.get(domain, "Technology roles reward continuous learning and project ownership.")


# Singleton
_engine = None


def get_analytics_engine():
    global _engine
    if _engine is None:
        _engine = AISkillAnalyticsEngine()
    return _engine


def analyze_skills(user_skills: List[str], experience_years: Optional[int] = None,
                   cv_text: str = '', soft_skills: Optional[List[str]] = None) -> Dict:
    engine = get_analytics_engine()
    return engine.analyze(user_skills, experience_years, cv_text, soft_skills)
