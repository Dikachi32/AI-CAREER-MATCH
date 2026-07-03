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
        if not self.jobs:
            return
        job_texts = [self._job_to_text(job) for job in self.jobs]
        if job_texts:
            self.job_vectors = self.vectorizer.fit_transform(job_texts)
    
    def _job_to_text(self, job):
        parts = [
            job.get('title', ''),
            job.get('description', ''),
            ' '.join(job.get('skills', [])),
            job.get('experience_level', ''),
            job.get('industry', '')
        ]
        return ' '.join(parts).lower()
    
    def enrich_jobs(self, keyword, location):
        live_jobs = fetch_real_jobs(keyword, location)
        if live_jobs:
            existing_ids = {j['job_id'] for j in self.jobs}
            for job in live_jobs:
                if job['job_id'] not in existing_ids:
                    self.jobs.append(job)
            self._build_index()
    
    def match_cv(self, cv_text, location=None, top_k=20):
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