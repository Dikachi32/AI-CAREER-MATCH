import requests
import os
import urllib3
from config import Config

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_real_jobs(query, location=None, num_pages=2):
    api_key = Config.JSEARCH_API_KEY
    api_host = Config.JSEARCH_API_HOST
    
    if not api_key:
        print("WARNING: JSEARCH_API_KEY not found in environment.")
        return []
    
    url = "https://jsearch.p.rapidapi.com/search"
    
    # Clean query: remove special chars, limit length
    clean_query = ' '.join(query.split()[:6])
    if location and location.strip():
        clean_query += f" in {location.strip()}"
    
    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": api_host
    }
    
    all_jobs = []
    
    for page in range(1, num_pages + 1):
        params = {
            "query": clean_query,
            "page": str(page),
            "num_pages": "1"
        }
        
        try:
            print(f"[JSearch] Requesting: '{clean_query}' page {page}")
            response = requests.get(url, headers=headers, params=params, timeout=15, verify=False)
            print(f"[JSearch] Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                jobs_data = data.get('data', [])
                print(f"[JSearch] Jobs returned: {len(jobs_data)}")
                
                for job in jobs_data:
                    city = job.get('job_city') or ''
                    country = job.get('job_country') or ''
                    loc = f"{city}, {country}".strip(', ')
                    
                    is_remote = any(word in (job.get('job_title', '') + ' ' + job.get('job_description', '')).lower() 
                                   for word in ['remote', 'work from home', 'wfh'])
                    
                    salary = job.get('job_salary') or job.get('job_min_salary') or 'N/A'
                    if salary != 'N/A' and job.get('job_max_salary'):
                        salary = f"${job.get('job_min_salary', 0)} - ${job.get('job_max_salary')}"
                    
                    apply_link = job.get('job_apply_link') or job.get('job_google_link') or '#'
                    
                    all_jobs.append({
                        'job_id': job.get('job_id'),
                        'title': job.get('job_title'),
                        'company': job.get('employer_name'),
                        'location': loc or 'Remote / Unspecified',
                        'description': job.get('job_description', 'No description available.'),
                        'apply_link': apply_link,
                        'salary_range': str(salary),
                        'remote': is_remote,
                        'experience_level': job.get('job_employment_type') or 'N/A',
                        'industry': job.get('employer_company_type') or 'Technology',
                        'match_score': 0
                    })
            elif response.status_code == 401:
                print("!!! JSearch API KEY INVALID !!!")
            elif response.status_code == 429:
                print("!!! JSearch API RATE LIMIT HIT !!!")
            else:
                print(f"[JSearch] Error: {response.status_code} - {response.text[:200]}")
                
        except Exception as e:
            print(f"[JSearch] Exception: {e}")
    
    print(f"[JSearch] TOTAL JOBS FETCHED: {len(all_jobs)}")
    return all_jobs