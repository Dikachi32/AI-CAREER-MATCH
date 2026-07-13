import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from .job_loader import load_jobs
from .job_fetcher import fetch_real_jobs


class JobMatcher:
    def __init__(self, model_name='all-MiniLM-L6-v2', jobs_json_path='data/jobs.json'):
        self.model_name = model_name
        self.jobs_json_path = jobs_json_path
        self.jobs = load_jobs(jobs_json_path)
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.job_vectors = None
        self._build_index()

    def _build_index(self):
        """Build TF-IDF index from pre-loaded local jobs."""
        if not self.jobs:
            return
        job_texts = [self._job_to_text(job) for job in self.jobs]
        if job_texts:
            self.job_vectors = self.vectorizer.fit_transform(job_texts)

    def _build_index_for_jobs(self, jobs):
        """Build TF-IDF index from an arbitrary list of jobs."""
        if not jobs:
            return None, None
        job_texts = [self._job_to_text(job) for job in jobs]
        if not job_texts:
            return None, None
        vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        job_vectors = vectorizer.fit_transform(job_texts)
        return vectorizer, job_vectors

    def _job_to_text(self, job):
        """Convert a job dict to a single text string for vectorization."""
        parts = [
            job.get('title', ''),
            job.get('description', ''),
            ' '.join(job.get('skills', [])),
            job.get('experience_level', ''),
            job.get('industry', '')
        ]
        return ' '.join(parts).lower()

    def _extract_skills_from_text(self, text):
        """Extract common tech skills from text."""
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
        text_lower = text.lower()
        found = [skill for skill in common_skills if skill in text_lower]
        return found

    def enrich_jobs(self, keyword, location):
        """Fetch live jobs and merge into local job index."""
        live_jobs = fetch_real_jobs(keyword, location)
        if live_jobs:
            existing_ids = {j.get('job_id') for j in self.jobs}
            for job in live_jobs:
                if job.get('job_id') not in existing_ids:
                    self.jobs.append(job)
            self._build_index()

    def match_cv(self, cv_text, location=None, top_k=20):
        """
        Match CV against pre-loaded local jobs.
        Legacy method preserved for backward compatibility.
        """
        if not self.jobs or self.job_vectors is None:
            return []

        cv_clean = cv_text.lower()
        cv_vector = self.vectorizer.transform([cv_clean])

        similarities = cosine_similarity(cv_vector, self.job_vectors).flatten()

        results = []
        for idx, score in enumerate(similarities):
            job = self.jobs[idx]

            # Location filter
            if location:
                job_loc = job.get('location', '').lower()
                if location not in job_loc and 'remote' not in job_loc:
                    continue

            # Skill match analysis
            job_skills = set(s.lower() for s in job.get('skills', []))
            cv_words = set(re.findall(r'\b[a-z]+\b', cv_clean))

            matched_skills = list(job_skills.intersection(cv_words))
            missing_skills = list(job_skills - cv_words)

            # Boost score based on skill overlap
            if job_skills:
                skill_ratio = len(matched_skills) / len(job_skills)
                adjusted_score = min(0.99, score * 0.6 + skill_ratio * 0.4)
            else:
                adjusted_score = score

            results.append({
                'job_id': job.get('job_id', idx),
                'title': job.get('title', 'Unknown Position'),
                'company': job.get('company', 'Unknown Company'),
                'location': job.get('location', 'Remote'),
                'salary_range': job.get('salary_range', 'Competitive'),
                'experience_level': job.get('experience_level', 'Not specified'),
                'industry': job.get('industry', 'Technology'),
                'remote': job.get('remote', False),
                'description': job.get('description', '')[:300],
                'apply_link': job.get('apply_link', '#'),
                'match_score': round(adjusted_score * 100, 1),
                'matched_skills': matched_skills[:5],
                'missing_skills': missing_skills[:5],
                'skills': job.get('skills', [])
            })

        results.sort(key=lambda x: x['match_score'], reverse=True)
        return results[:top_k]

    def match_jobs(self, cv_text, jobs, top_n=10):
        """
        Match CV against an arbitrary list of jobs (e.g., from JSearch API).
        This is the method called by app.py's /recommendations endpoint.

        Args:
            cv_text: Raw CV text string
            jobs: List of job dicts from external API
            top_n: Number of top matches to return

        Returns:
            List of enriched job dicts with match scores and skill analysis
        """
        if not jobs:
            return []

        if not cv_text or not cv_text.strip():
            # No CV text — return jobs unranked with zero scores
            return [
                {
                    'job_id': job.get('job_id') or f"job-{idx}",
                    'title': job.get('title', 'Unknown Position'),
                    'company': job.get('company', 'Unknown Company'),
                    'location': job.get('location', 'Remote'),
                    'salary_range': job.get('salary_range', 'Competitive'),
                    'experience_level': job.get('experience_level', 'Not specified'),
                    'industry': job.get('industry', 'Technology'),
                    'remote': job.get('remote', False),
                    'description': job.get('description', 'No description available.')[:300],
                    'apply_link': job.get('apply_link', '#'),
                    'match_score': 0,
                    'matched_skills': [],
                    'missing_skills': [],
                    'skills': []
                }
                for idx, job in enumerate(jobs[:top_n])
            ]

        cv_clean = cv_text.lower()

        # Build TF-IDF index for the provided jobs
        vectorizer, job_vectors = self._build_index_for_jobs(jobs)
        if job_vectors is None:
            return []

        cv_vector = vectorizer.transform([cv_clean])
        similarities = cosine_similarity(cv_vector, job_vectors).flatten()

        # Extract skills from CV for matching
        cv_skills = set(self._extract_skills_from_text(cv_clean))
        cv_words = set(re.findall(r'\b[a-z]+\b', cv_clean))

        results = []
        for idx, score in enumerate(similarities):
            job = jobs[idx]

            # Extract skills from job description (API jobs don't have explicit skills arrays)
            job_desc = job.get('description', '')
            job_title = job.get('title', '')
            job_text = f"{job_title} {job_desc}".lower()
            job_skills = set(self._extract_skills_from_text(job_text))

            # Also do word-level matching for broader skill detection
            job_words = set(re.findall(r'\b[a-z]+\b', job_text))

            matched_skills = list(job_skills.intersection(cv_skills))
            missing_skills = list(job_skills - cv_skills)

            # Word-level overlap for additional scoring
            word_overlap = len(job_words.intersection(cv_words))
            word_union = len(job_words.union(cv_words))
            word_similarity = word_overlap / max(word_union, 1)

            # Combined score: TF-IDF similarity (50%) + skill overlap (30%) + word overlap (20%)
            if job_skills:
                skill_ratio = len(matched_skills) / len(job_skills)
            else:
                skill_ratio = 0

            adjusted_score = min(0.99, score * 0.5 + skill_ratio * 0.3 + word_similarity * 0.2)

            results.append({
                'job_id': job.get('job_id') or f"job-{idx}",
                'title': job.get('title', 'Unknown Position'),
                'company': job.get('company', 'Unknown Company'),
                'location': job.get('location', 'Remote / Unspecified'),
                'salary_range': job.get('salary_range', 'Competitive'),
                'experience_level': job.get('experience_level', 'Not specified'),
                'industry': job.get('industry', 'Technology'),
                'remote': job.get('remote', False),
                'description': job.get('description', 'No description available.')[:300],
                'apply_link': job.get('apply_link', '#'),
                'match_score': round(adjusted_score * 100, 1),
                'matched_skills': matched_skills[:5],
                'missing_skills': missing_skills[:5],
                'skills': list(job_skills)[:10]
            })

        results.sort(key=lambda x: x['match_score'], reverse=True)
        return results[:top_n]
