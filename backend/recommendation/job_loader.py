import json
import os

def load_jobs(jobs_json_path):
    if not os.path.exists(jobs_json_path):
        return []
    with open(jobs_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        if isinstance(data, list):
            return data
        return data.get('jobs', [])

def save_jobs(jobs_json_path, jobs):
    with open(jobs_json_path, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2)