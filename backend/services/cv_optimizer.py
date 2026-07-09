"""
AI CV Optimizer & ATS Enhancement (Phase 4)
Professional AI-powered resume optimization system using Gemini.
Analyzes CV against job descriptions to provide ATS scores, keyword matching,
rewritten sections, and actionable improvement plans.
"""

import json
import logging
import re
from typing import Dict, List, Any, Optional

from clients.gemini_client import GeminiClient, GeminiAPIError, GeminiTimeoutError, GeminiParsingError

logger = logging.getLogger(__name__)


class CVOptimizerEngine:
    """
    Phase 4: AI-powered CV Optimizer and ATS Enhancement Engine.
    Provides comprehensive resume analysis, rewriting, and optimization.
    """

    # Schema for structured ATS optimization response
    ATS_OPTIMIZATION_SCHEMA = {
        "type": "object",
        "properties": {
            "atsScore": {
                "type": "object",
                "properties": {
                    "overall": {"type": "number", "minimum": 0, "maximum": 100},
                    "formatting": {"type": "number", "minimum": 0, "maximum": 100},
                    "keywordMatch": {"type": "number", "minimum": 0, "maximum": 100},
                    "readability": {"type": "number", "minimum": 0, "maximum": 100},
                    "completeness": {"type": "number", "minimum": 0, "maximum": 100}
                },
                "required": ["overall", "formatting", "keywordMatch", "readability", "completeness"]
            },
            "resumeMatchScore": {
                "type": "number",
                "minimum": 0,
                "maximum": 100,
                "description": "How well the resume matches the specific job"
            },
            "keywordAnalysis": {
                "type": "object",
                "properties": {
                    "matchedKeywords": {"type": "array", "items": {"type": "string"}},
                    "missingKeywords": {"type": "array", "items": {"type": "string"}},
                    "keywordDensity": {"type": "string"},
                    "suggestions": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["matchedKeywords", "missingKeywords"]
            },
            "missingSkills": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "skill": {"type": "string"},
                        "importance": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                        "context": {"type": "string"}
                    },
                    "required": ["skill", "importance"]
                }
            },
            "strengths": {
                "type": "array",
                "items": {"type": "string"}
            },
            "weaknesses": {
                "type": "array",
                "items": {"type": "string"}
            },
            "improvedProfessionalSummary": {
                "type": "object",
                "properties": {
                    "original": {"type": "string"},
                    "improved": {"type": "string"},
                    "changes": {"type": "array", "items": {"type": "string"}},
                    "whyBetter": {"type": "string"}
                },
                "required": ["original", "improved", "whyBetter"]
            },
            "improvedExperience": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "company": {"type": "string"},
                        "role": {"type": "string"},
                        "originalBullets": {"type": "array", "items": {"type": "string"}},
                        "improvedBullets": {"type": "array", "items": {"type": "string"}},
                        "improvements": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["company", "role", "originalBullets", "improvedBullets"]
                }
            },
            "improvedSkillsSection": {
                "type": "object",
                "properties": {
                    "original": {"type": "array", "items": {"type": "string"}},
                    "improved": {"type": "array", "items": {"type": "string"}},
                    "added": {"type": "array", "items": {"type": "string"}},
                    "removed": {"type": "array", "items": {"type": "string"}},
                    "rationale": {"type": "string"}
                },
                "required": ["original", "improved"]
            },
            "bulletPointImprovements": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "original": {"type": "string"},
                        "improved": {"type": "string"},
                        "reason": {"type": "string"}
                    },
                    "required": ["original", "improved", "reason"]
                }
            },
            "formattingSuggestions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "issue": {"type": "string"},
                        "severity": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                        "fix": {"type": "string"},
                        "example": {"type": "string"}
                    },
                    "required": ["issue", "severity", "fix"]
                }
            },
            "grammarWriting": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "original": {"type": "string"},
                        "issue": {"type": "string"},
                        "correction": {"type": "string"},
                        "explanation": {"type": "string"}
                    },
                    "required": ["original", "issue", "correction"]
                }
            },
            "recruiterFeedback": {
                "type": "object",
                "properties": {
                    "firstImpression": {"type": "string"},
                    "timeToRead": {"type": "string"},
                    "standoutElements": {"type": "array", "items": {"type": "string"}},
                    "redFlags": {"type": "array", "items": {"type": "string"}},
                    "overallVerdict": {"type": "string"}
                },
                "required": ["firstImpression", "overallVerdict"]
            },
            "actionPlan": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "step": {"type": "number"},
                        "action": {"type": "string"},
                        "priority": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                        "timeEstimate": {"type": "string"},
                        "impact": {"type": "string"}
                    },
                    "required": ["step", "action", "priority", "impact"]
                }
            }
        },
        "required": [
            "atsScore", "resumeMatchScore", "keywordAnalysis", "missingSkills",
            "strengths", "weaknesses", "improvedProfessionalSummary",
            "improvedExperience", "improvedSkillsSection", "formattingSuggestions",
            "recruiterFeedback", "actionPlan"
        ]
    }

    SYSTEM_INSTRUCTION = """You are an elite ATS Resume Optimization Expert and Senior Technical Recruiter with 15+ years of experience at Fortune 500 companies. You specialize in:

1. ATS SYSTEMS: You understand how Applicant Tracking Systems (ATS) parse, score, and rank resumes. You know exactly what formatting kills ATS readability and what structures maximize parse success.

2. KEYWORD OPTIMIZATION: You identify critical job-specific keywords and ensure they appear naturally in the resume. You understand semantic matching vs exact matching.

3. IMPACT-FOCUSED WRITING: You transform passive, responsibility-focused bullet points into active, achievement-focused statements with quantifiable metrics.

4. RECRUITER PSYCHOLOGY: You know recruiters spend 6-10 seconds on first scan. You optimize for scanability, visual hierarchy, and instant comprehension.

5. INDUSTRY STANDARDS: You follow current resume best practices for tech roles including proper section ordering, optimal length, and modern formatting conventions.

Your analysis is honest, specific, and actionable. You don't sugarcoat weaknesses but you provide clear paths to improvement."""

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.client = gemini_client or GeminiClient()

    def _build_optimization_prompt(self, cv_text: str, job_title: str, job_description: str) -> str:
        """Construct the comprehensive ATS optimization prompt."""

        prompt = f"""Analyze and optimize the following CV for the target job. Provide a complete ATS optimization report with rewritten sections.

=== CANDIDATE CV ===
{cv_text[:8000]}

=== TARGET JOB ===
Title: {job_title}

Job Description:
{job_description[:6000]}

=== OPTIMIZATION INSTRUCTIONS ===

1. ATS SCORE: Evaluate the resume on 5 dimensions (each 0-100):
   - Overall: General ATS compatibility
   - Formatting: Structure, headers, parseability
   - Keyword Match: How well keywords align with job description
   - Readability: Clarity, scanability for recruiters
   - Completeness: All expected sections present and detailed

2. RESUME MATCH SCORE: 0-100 score specifically for this job

3. KEYWORD ANALYSIS: List matched and missing keywords from job description

4. MISSING SKILLS: Identify critical skills from job description not in CV

5. STRENGTHS & WEAKNESSES: Honest assessment

6. REWRITE SECTIONS:
   - Professional Summary: Rewrite to be more impactful, keyword-rich, and tailored
   - Experience Bullets: Transform passive language to active, metric-driven achievements
   - Skills Section: Reorganize, add missing critical skills, remove irrelevant ones

7. FORMATTING SUGGESTIONS: Specific ATS and recruiter-friendly formatting fixes

8. GRAMMAR & WRITING: Identify and correct specific issues

9. RECRUITER FEEDBACK: Simulate a recruiter's 10-second scan impression

10. ACTION PLAN: Prioritized steps to implement improvements

CRITICAL RULES:
- Preserve all factual information and achievements
- Never invent metrics or experiences the candidate didn't have
- Make passive voice active ("Responsible for" → "Led", "Managed" → "Drove")
- Add quantifiable impact where possible (%, $, time saved)
- Ensure every rewritten bullet starts with a strong action verb
- Keep rewritten sections roughly the same length or slightly shorter
- Tailor content specifically to the target job

Respond with valid JSON ONLY. No markdown, no explanations outside JSON."""

        return prompt

    def optimize_cv(self, cv_text: str, job_title: str, job_description: str) -> Dict[str, Any]:
        """
        Phase 4: Generate comprehensive AI-powered CV optimization.
        Returns ATS scores, rewritten sections, and actionable improvements.
        """

        prompt = self._build_optimization_prompt(cv_text, job_title, job_description)

        try:
            result = self.client.generate_structured(
                prompt=prompt,
                schema=self.ATS_OPTIMIZATION_SCHEMA,
                temperature=0.15,
                max_output_tokens=4096,
                system_instruction=self.SYSTEM_INSTRUCTION
            )

            if result.get("success") and result.get("parsed_as_json"):
                optimization_data = result["data"]

                # Validate required keys
                required_keys = [
                    "atsScore", "resumeMatchScore", "keywordAnalysis", "missingSkills",
                    "strengths", "weaknesses", "improvedProfessionalSummary",
                    "improvedExperience", "improvedSkillsSection", "formattingSuggestions",
                    "recruiterFeedback", "actionPlan"
                ]

                for key in required_keys:
                    if key not in optimization_data:
                        optimization_data[key] = self._get_fallback_section(key)

                return {
                    "success": True,
                    "data": optimization_data,
                    "source": "gemini_ai_optimizer",
                    "model": result.get("model", "unknown"),
                    "cached": False,
                    "phase": 4
                }

            return self._handle_unstructured_response(result)

        except (GeminiAPIError, GeminiTimeoutError, GeminiParsingError) as e:
            logger.error(f"Gemini API error in CV optimization: {str(e)}")
            return self._get_degraded_response(str(e))
        except Exception as e:
            logger.exception("Unexpected error in CV optimization")
            return self._get_degraded_response(str(e))

    def quick_ats_check(self, cv_text: str, job_title: str, job_description: str) -> Dict[str, Any]:
        """Quick ATS compatibility check with minimal token usage."""

        prompt = f"""Quick ATS check. Respond with JSON only.

CV: {cv_text[:2000]}
Job: {job_title}
Description: {job_description[:1500]}

Return JSON:
- atsScore (object: overall, formatting, keywordMatch, readability, completeness)
- topIssue (string)
- quickFix (string)
- matchScore (number 0-100)"""

        try:
            result = self.client.generate_structured(
                prompt=prompt,
                temperature=0.1,
                max_output_tokens=1024
            )

            if result.get("success") and result.get("parsed_as_json"):
                return {
                    "success": True,
                    "data": result["data"],
                    "source": "gemini_ai_quick_ats"
                }

            return {
                "success": False,
                "data": {"atsScore": {"overall": 0}, "matchScore": 0},
                "error": "Failed to parse quick ATS check"
            }

        except Exception as e:
            logger.error(f"Quick ATS check failed: {str(e)}")
            return {
                "success": False,
                "data": {"atsScore": {"overall": 0}, "matchScore": 0},
                "error": str(e)
            }

    def _handle_unstructured_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Handle non-JSON responses."""
        raw_text = result.get("raw_text", "")
        logger.warning(f"Unstructured CV optimization response. Length: {len(raw_text)}")

        return {
            "success": True,
            "data": {
                "atsScore": {"overall": 0, "formatting": 0, "keywordMatch": 0, "readability": 0, "completeness": 0},
                "resumeMatchScore": 0,
                "keywordAnalysis": {"matchedKeywords": [], "missingKeywords": [], "suggestions": []},
                "missingSkills": [],
                "strengths": [],
                "weaknesses": ["Unable to parse structured analysis"],
                "improvedProfessionalSummary": {"original": "", "improved": "", "changes": [], "whyBetter": "Analysis unavailable"},
                "improvedExperience": [],
                "improvedSkillsSection": {"original": [], "improved": [], "added": [], "removed": [], "rationale": "Analysis unavailable"},
                "bulletPointImprovements": [],
                "formattingSuggestions": [],
                "grammarWriting": [],
                "recruiterFeedback": {"firstImpression": "Analysis unavailable", "overallVerdict": "Unable to assess"},
                "actionPlan": [],
                "rawAnalysis": raw_text,
                "parseError": True
            },
            "source": "gemini_ai_optimizer_fallback",
            "model": result.get("model", "unknown"),
            "cached": False,
            "phase": 4
        }

    def _get_degraded_response(self, error_message: str) -> Dict[str, Any]:
        """Graceful degradation."""
        return {
            "success": False,
            "data": {
                "atsScore": {"overall": 0, "formatting": 0, "keywordMatch": 0, "readability": 0, "completeness": 0},
                "resumeMatchScore": 0,
                "keywordAnalysis": {"matchedKeywords": [], "missingKeywords": [], "suggestions": []},
                "missingSkills": [],
                "strengths": [],
                "weaknesses": ["AI optimization service temporarily unavailable"],
                "improvedProfessionalSummary": {"original": "", "improved": "", "changes": [], "whyBetter": "Service unavailable"},
                "improvedExperience": [],
                "improvedSkillsSection": {"original": [], "improved": [], "added": [], "removed": [], "rationale": "Service unavailable"},
                "formattingSuggestions": [{"issue": "Service unavailable", "severity": "High", "fix": "Retry optimization"}],
                "recruiterFeedback": {"firstImpression": "Service unavailable", "overallVerdict": "Unable to assess"},
                "actionPlan": [{"step": 1, "action": "Retry AI optimization", "priority": "High", "timeEstimate": "1 minute", "impact": "Restore full optimization"}],
                "error": error_message,
                "serviceAvailable": False
            },
            "source": "degraded_optimizer_fallback",
            "model": "none",
            "cached": False,
            "phase": 4
        }

    def _get_fallback_section(self, section_name: str) -> Any:
        """Return empty fallback section."""
        fallbacks = {
            "atsScore": {"overall": 0, "formatting": 0, "keywordMatch": 0, "readability": 0, "completeness": 0},
            "resumeMatchScore": 0,
            "keywordAnalysis": {"matchedKeywords": [], "missingKeywords": [], "keywordDensity": "Unknown", "suggestions": []},
            "missingSkills": [],
            "strengths": [],
            "weaknesses": ["Section data unavailable"],
            "improvedProfessionalSummary": {"original": "", "improved": "", "changes": [], "whyBetter": "Data unavailable"},
            "improvedExperience": [],
            "improvedSkillsSection": {"original": [], "improved": [], "added": [], "removed": [], "rationale": "Data unavailable"},
            "bulletPointImprovements": [],
            "formattingSuggestions": [],
            "grammarWriting": [],
            "recruiterFeedback": {"firstImpression": "Data unavailable", "timeToRead": "Unknown", "standoutElements": [], "redFlags": [], "overallVerdict": "Unable to assess"},
            "actionPlan": []
        }
        return fallbacks.get(section_name, [] if "Skills" in section_name or "Experience" in section_name or "Suggestions" in section_name or "Plan" in section_name else {})


# Singleton instance
_cv_optimizer_engine: Optional[CVOptimizerEngine] = None


def get_cv_optimizer_engine() -> CVOptimizerEngine:
    """Get or create the singleton CV optimizer engine."""
    global _cv_optimizer_engine
    if _cv_optimizer_engine is None:
        _cv_optimizer_engine = CVOptimizerEngine()
    return _cv_optimizer_engine


def optimize_cv(cv_text: str, job_title: str, job_description: str) -> Dict[str, Any]:
    """Convenience function for full CV optimization."""
    engine = get_cv_optimizer_engine()
    return engine.optimize_cv(cv_text, job_title, job_description)


def quick_ats_check(cv_text: str, job_title: str, job_description: str) -> Dict[str, Any]:
    """Convenience function for quick ATS check."""
    engine = get_cv_optimizer_engine()
    return engine.quick_ats_check(cv_text, job_title, job_description)