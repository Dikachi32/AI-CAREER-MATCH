"""
Centralized Google Gemini Service for AI Career Match.
Handles all Gemini API interactions with retries, timeouts, and graceful fallbacks.
"""

import os
import json
import re
import time
import traceback
from typing import Optional, Dict, Any

import google.generativeai as genai
from google.api_core.exceptions import GoogleAPICallError, ResourceExhausted, DeadlineExceeded
from google.generativeai.types import GenerationConfig

from config import Config


class GeminiClient:
    """
    Production-ready Gemini client with:
    - Configurable model and timeout
    - Exponential backoff retries
    - Structured JSON extraction with validation
    - Graceful fallback to empty structure on failure
    """

    _instance = None
    _initialized = False

    def __new__(cls):
        """Singleton pattern to ensure one configured client across the app."""
        if cls._instance is None:
            cls._instance = super(GeminiClient, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if GeminiClient._initialized:
            return

        self.api_key = Config.GEMINI_API_KEY
        self.model_name = Config.GEMINI_MODEL
        self.timeout = Config.GEMINI_TIMEOUT
        self.max_retries = Config.GEMINI_MAX_RETRIES
        self.retry_delay = Config.GEMINI_RETRY_DELAY

        if not self.api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. "
                "Please set it in the backend/.env file."
            )

        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
        GeminiClient._initialized = True

    def _build_cv_extraction_prompt(self, cv_text: str) -> str:
        """
        Build a strict prompt that forces Gemini to return only valid JSON.
        """
        # Truncate extremely long CVs to avoid token limits
        max_chars = 15000
        truncated_text = cv_text[:max_chars]
        if len(cv_text) > max_chars:
            truncated_text += "\n\n[CV truncated due to length...]"

        prompt = f"""You are an expert CV/Resume parser and recruiter AI. Your task is to extract structured information from the CV text provided below.

INSTRUCTIONS:
1. Extract ALL possible fields accurately.
2. Return ONLY a valid JSON object. No markdown, no explanations, no code blocks.
3. Use null for missing fields, never omit keys.
4. For arrays, return empty arrays [] if none found.
5. Be precise with skills: distinguish technical skills, soft skills, leadership skills, frameworks, libraries, databases, cloud platforms, and DevOps tools.
6. Career level: one of ["Entry-Level", "Mid-Level", "Senior-Level", "Lead", "Principal", "Executive"].
7. Years of experience: return as a number (float). If a range is given (e.g., "5-7 years"), return the lower bound.
8. Education: array of objects with keys: degree, field, institution, year.
9. Projects: array of objects with keys: name, description, technologies, url.

REQUIRED JSON STRUCTURE:
{{
  "full_name": string | null,
  "email": string | null,
  "phone": string | null,
  "linkedin": string | null,
  "github": string | null,
  "portfolio": string | null,
  "location": string | null,
  "professional_summary": string | null,
  "current_role": string | null,
  "career_level": string | null,
  "years_of_experience": number | null,
  "education": [{{"degree": string, "field": string, "institution": string, "year": string}}],
  "certifications": [string],
  "projects": [{{"name": string, "description": string, "technologies": [string], "url": string}}],
  "awards": [string],
  "languages": [string],
  "technical_skills": [string],
  "soft_skills": [string],
  "leadership_skills": [string],
  "frameworks": [string],
  "libraries": [string],
  "databases": [string],
  "cloud_platforms": [string],
  "devops_tools": [string],
  "industry": string | null,
  "specialization": string | null
}}

CV TEXT:
{truncated_text}

JSON OUTPUT:"""
        return prompt

    def _sanitize_json_response(self, raw_text: str) -> Optional[str]:
        """
        Extract JSON from Gemini response, handling markdown code blocks and extra whitespace.
        """
        if not raw_text:
            return None

        raw_text = raw_text.strip()

        # Remove markdown code blocks
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]

        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        raw_text = raw_text.strip()

        # Sometimes Gemini wraps JSON in extra text; try to find the first { and last }
        try:
            start = raw_text.index('{')
            end = raw_text.rindex('}') + 1
            return raw_text[start:end]
        except ValueError:
            return raw_text if raw_text.startswith('{') else None

    def _validate_and_default(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure all expected keys exist with proper types. Fill missing with defaults.
        """
        defaults = {
            'full_name': None,
            'email': None,
            'phone': None,
            'linkedin': None,
            'github': None,
            'portfolio': None,
            'location': None,
            'professional_summary': None,
            'current_role': None,
            'career_level': None,
            'years_of_experience': None,
            'education': [],
            'certifications': [],
            'projects': [],
            'awards': [],
            'languages': [],
            'technical_skills': [],
            'soft_skills': [],
            'leadership_skills': [],
            'frameworks': [],
            'libraries': [],
            'databases': [],
            'cloud_platforms': [],
            'devops_tools': [],
            'industry': None,
            'specialization': None
        }

        if not isinstance(data, dict):
            return defaults

        result = {}
        for key, default in defaults.items():
            val = data.get(key)
            if val is None:
                result[key] = default
            elif isinstance(default, list) and not isinstance(val, list):
                result[key] = [val] if val else []
            else:
                result[key] = val
        return result

    def extract_cv_profile(self, cv_text: str) -> Dict[str, Any]:
        """
        Main entry point: extract structured CV profile using Gemini.
        Implements retry logic with exponential backoff.
        """
        if not cv_text or not cv_text.strip():
            return self._validate_and_default({})

        prompt = self._build_cv_extraction_prompt(cv_text)

        last_exception = None
        for attempt in range(1, self.max_retries + 1):
            try:
                generation_config = GenerationConfig(
                    temperature=0.1,  # Low temperature for deterministic extraction
                    max_output_tokens=4096,
                    response_mime_type="application/json"
                )

                response = self.model.generate_content(
                    prompt,
                    generation_config=generation_config,
                    request_options={'timeout': self.timeout}
                )

                if not response or not response.text:
                    raise ValueError("Empty response from Gemini API")

                json_str = self._sanitize_json_response(response.text)
                if not json_str:
                    raise ValueError("Could not extract JSON from Gemini response")

                parsed = json.loads(json_str)
                return self._validate_and_default(parsed)

            except (ResourceExhausted, DeadlineExceeded) as e:
                # Rate limit or timeout: retry with backoff
                last_exception = e
                wait_time = self.retry_delay * (2 ** (attempt - 1))
                time.sleep(wait_time)
                continue

            except (GoogleAPICallError, json.JSONDecodeError, ValueError) as e:
                last_exception = e
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay)
                    continue
                break

            except Exception as e:
                last_exception = e
                traceback.print_exc()
                break

        # All retries exhausted: log and return safe fallback
        print(f"[GeminiClient] All retries failed. Last error: {last_exception}")
        return self._validate_and_default({})

    def health_check(self) -> Dict[str, Any]:
        """
        Quick health check to verify Gemini connectivity.
        """
        try:
            response = self.model.generate_content(
                "Say 'OK' and nothing else.",
                generation_config=GenerationConfig(max_output_tokens=10)
            )
            return {
                'status': 'healthy',
                'model': self.model_name,
                'response': response.text.strip() if response and response.text else 'No response'
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'model': self.model_name,
                'error': str(e)
            }


# Global singleton instance
gemini_client = GeminiClient()