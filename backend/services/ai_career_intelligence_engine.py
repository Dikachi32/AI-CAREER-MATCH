"""
AI Career Intelligence Engine (Phase 2)
Comprehensive career intelligence generation using the centralized GeminiClient.
Integrates with AIProfile data, user CV, and job details to produce structured,
frontend-ready JSON responses.

This engine reuses the Phase 1 GeminiClient (clients/gemini_client.py) and
enhances prompt engineering for consistent, reliable, structured output.
"""

import json
import logging
from typing import Dict, List, Any, Optional

from clients.gemini_client import GeminiClient, GeminiAPIError, GeminiTimeoutError, GeminiParsingError
from models import AIProfile

logger = logging.getLogger(__name__)


class AICareerIntelligenceEngine:
    """
    Phase 2 AI Career Intelligence Engine.
    Generates comprehensive, structured career intelligence by analyzing:
    - User CV/Profile (including AIProfile if available)
    - Selected Job details
    - Skills, Experience, Education alignment
    - ATS compatibility
    - Interview preparation
    - Salary insights
    - Career growth advice
    """

    # Comprehensive JSON schema for structured output validation
    INTELLIGENCE_SCHEMA = {
        "type": "object",
        "properties": {
            "overallMatchScore": {
                "type": "number",
                "minimum": 0,
                "maximum": 100,
                "description": "Overall match percentage between candidate and job"
            },
            "matchSummary": {
                "type": "string",
                "description": "2-3 sentence executive summary of the match"
            },
            "matchCategory": {
                "type": "string",
                "enum": ["Excellent", "Good", "Fair", "Poor"],
                "description": "Qualitative match assessment"
            },
            "strengths": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Candidate strengths relevant to this role"
            },
            "weaknesses": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Candidate gaps or weaknesses for this role"
            },
            "missingSkills": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "skill": {"type": "string"},
                        "importance": {"type": "string", "enum": ["Critical", "High", "Medium", "Low"]},
                        "learningTimeWeeks": {"type": "number"}
                    },
                    "required": ["skill", "importance"]
                }
            },
            "skillGapAnalysis": {
                "type": "object",
                "properties": {
                    "matchedSkills": {"type": "array", "items": {"type": "string"}},
                    "missingSkills": {"type": "array", "items": {"type": "string"}},
                    "transferableSkills": {"type": "array", "items": {"type": "string"}},
                    "skillMatchPercentage": {"type": "number", "minimum": 0, "maximum": 100},
                    "recommendedLearning": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["matchedSkills", "missingSkills", "skillMatchPercentage"]
            },
            "experienceAnalysis": {
                "type": "object",
                "properties": {
                    "yearsRequired": {"type": "number"},
                    "yearsCandidate": {"type": "number"},
                    "experienceMatch": {"type": "string", "enum": ["Strong", "Good", "Partial", "Insufficient"]},
                    "relevantExperience": {"type": "string"},
                    "experienceGaps": {"type": "array", "items": {"type": "string"}},
                    "keyAchievements": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["experienceMatch", "relevantExperience"]
            },
            "educationAnalysis": {
                "type": "object",
                "properties": {
                    "degreeRequired": {"type": "string"},
                    "degreeCandidate": {"type": "string"},
                    "educationMatch": {"type": "string", "enum": ["Strong", "Good", "Partial", "Insufficient"]},
                    "certificationsValue": {"type": "array", "items": {"type": "string"}},
                    "recommendedCertifications": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["educationMatch"]
            },
            "atsCompatibility": {
                "type": "object",
                "properties": {
                    "score": {"type": "number", "minimum": 0, "maximum": 100},
                    "issues": {"type": "array", "items": {"type": "string"}},
                    "recommendations": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["score"]
            },
            "recommendedImprovements": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "area": {"type": "string"},
                        "priority": {"type": "string", "enum": ["High", "Medium", "Low"]},
                        "action": {"type": "string"},
                        "impact": {"type": "string"}
                    },
                    "required": ["area", "priority", "action"]
                }
            },
            "interviewPreparation": {
                "type": "object",
                "properties": {
                    "likelyQuestions": {"type": "array", "items": {"type": "string"}},
                    "technicalTopics": {"type": "array", "items": {"type": "string"}},
                    "behavioralAngles": {"type": "array", "items": {"type": "string"}},
                    "preparationTimeDays": {"type": "number"}
                },
                "required": ["likelyQuestions", "technicalTopics"]
            },
            "salaryInsight": {
                "type": "object",
                "properties": {
                    "marketRange": {"type": "string"},
                    "candidatePositioning": {"type": "string"},
                    "negotiationTips": {"type": "array", "items": {"type": "string"}}
                }
            },
            "careerGrowthAdvice": {
                "type": "object",
                "properties": {
                    "roleTrajectory": {"type": "string"},
                    "nextRole": {"type": "string"},
                    "longTermPath": {"type": "string"},
                    "industryTrends": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["roleTrajectory", "nextRole"]
            },
            "learningRecommendations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "skill": {"type": "string"},
                        "resource": {"type": "string"},
                        "timeEstimate": {"type": "string"},
                        "priority": {"type": "string", "enum": ["High", "Medium", "Low"]}
                    },
                    "required": ["skill", "resource", "priority"]
                }
            },
            "personalizedNextSteps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "step": {"type": "number"},
                        "action": {"type": "string"},
                        "timeline": {"type": "string"},
                        "expectedOutcome": {"type": "string"}
                    },
                    "required": ["step", "action", "timeline"]
                }
            }
        },
        "required": [
            "overallMatchScore",
            "matchSummary",
            "matchCategory",
            "strengths",
            "weaknesses",
            "skillGapAnalysis",
            "experienceAnalysis",
            "educationAnalysis",
            "atsCompatibility",
            "recommendedImprovements",
            "interviewPreparation",
            "careerGrowthAdvice",
            "learningRecommendations",
            "personalizedNextSteps"
        ]
    }

    SYSTEM_INSTRUCTION = """You are an elite AI Career Intelligence analyst with 20+ years of experience in technical recruiting, career coaching, and talent strategy at top-tier companies (Google, Amazon, Microsoft, Meta). Your analysis is:

1. DATA-DRIVEN: Every insight must be grounded in the actual candidate and job data provided
2. ACTIONABLE: Every recommendation must include specific, concrete next steps
3. HONEST: Provide constructive but realistic assessments — don't inflate match scores
4. STRUCTURED: Always respond with valid JSON matching the exact schema requested
5. PERSONALIZED: Tailor every insight to the specific candidate and role, never generic advice

Your goal is to help candidates make informed career decisions and maximize their application success."""

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.client = gemini_client or GeminiClient()

    def _build_intelligence_prompt(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        company_name: Optional[str] = None,
        industry: Optional[str] = None,
        ai_profile: Optional[AIProfile] = None,
        user_skills: Optional[List[str]] = None
    ) -> str:
        """Construct the comprehensive Phase 2 intelligence prompt."""

        # Build candidate profile section
        candidate_section = f"=== CANDIDATE CV ===\n{cv_text[:6000]}\n"

        # If AIProfile exists, add structured data
        ai_profile_section = ""
        if ai_profile:
            ai_profile_section = f"""
=== STRUCTURED CANDIDATE PROFILE ===
Full Name: {ai_profile.full_name or 'Not provided'}
Current Role: {ai_profile.current_role or 'Not provided'}
Career Level: {ai_profile.career_level or 'Not provided'}
Years of Experience: {ai_profile.years_of_experience or 'Not provided'}
Location: {ai_profile.location or 'Not provided'}
Industry: {ai_profile.industry or 'Not provided'}
Specialization: {ai_profile.specialization or 'Not provided'}

Technical Skills: {', '.join(ai_profile.get_json_field('technical_skills'))}
Soft Skills: {', '.join(ai_profile.get_json_field('soft_skills'))}
Frameworks: {', '.join(ai_profile.get_json_field('frameworks'))}
Libraries: {', '.join(ai_profile.get_json_field('libraries'))}
Databases: {', '.join(ai_profile.get_json_field('databases'))}
Cloud Platforms: {', '.join(ai_profile.get_json_field('cloud_platforms'))}
DevOps Tools: {', '.join(ai_profile.get_json_field('devops_tools'))}

Education: {json.dumps(ai_profile.get_json_field('education'))}
Certifications: {', '.join(ai_profile.get_json_field('certifications'))}
Projects: {len(ai_profile.get_json_field('projects'))} project(s)
Languages: {', '.join(ai_profile.get_json_field('languages'))}
"""

        # Build job section
        company_section = f"Company: {company_name}\n" if company_name else ""
        industry_section = f"Industry: {industry}\n" if industry else ""

        job_section = f"""=== JOB OPPORTUNITY ===
Title: {job_title}
{company_section}{industry_section}

Job Description:
{job_description[:5000]}
"""

        # Build skills section
        skills_section = ""
        if user_skills:
            skills_section = f"\n=== EXTRACTED USER SKILLS ===\n{', '.join(user_skills)}\n"

        # Comprehensive instructions
        instructions = """
=== ANALYSIS INSTRUCTIONS ===
Generate a comprehensive AI Career Intelligence report as valid JSON.

SCORING GUIDELINES:
- overallMatchScore: 0-100 based on skills match (40%), experience fit (30%), education alignment (15%), culture/soft skills (15%)
- Excellent: 85-100, Good: 70-84, Fair: 50-69, Poor: 0-49

REQUIRED SECTIONS:
1. overallMatchScore: Numeric score 0-100
2. matchSummary: 2-3 sentence executive summary
3. matchCategory: One of ["Excellent", "Good", "Fair", "Poor"]
4. strengths: Array of candidate strengths for THIS specific role
5. weaknesses: Array of specific gaps for THIS role
6. missingSkills: Array of objects with skill, importance, learningTimeWeeks
7. skillGapAnalysis: Detailed skill mapping with percentages
8. experienceAnalysis: Years comparison, relevance, gaps, achievements
9. educationAnalysis: Degree matching, certifications, recommendations
10. atsCompatibility: Score 0-100 with specific issues and fixes
11. recommendedImprovements: Prioritized action items with impact
12. interviewPreparation: Likely questions, technical topics, behavioral angles, prep time
13. salaryInsight: Market range, positioning, negotiation tips (if data available)
14. careerGrowthAdvice: Role trajectory, next role, long-term path, industry trends
15. learningRecommendations: Specific skills with resources and time estimates
16. personalizedNextSteps: Numbered action plan with timeline and expected outcomes

CRITICAL RULES:
- Every insight must reference SPECIFIC data from the candidate or job
- Don't give generic advice — tailor everything to this candidate + role
- Be honest about gaps but constructive in recommendations
- Use real market data for salary ranges when possible
- For learning recommendations, suggest specific courses, certifications, or resources
- Interview questions should be tailored to the tech stack and role level

Respond with valid JSON ONLY. No markdown, no explanations outside JSON."""

        return candidate_section + ai_profile_section + job_section + skills_section + instructions

    def generate_full_intelligence(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        company_name: Optional[str] = None,
        industry: Optional[str] = None,
        ai_profile: Optional[AIProfile] = None,
        user_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive Phase 2 AI Career Intelligence.
        Returns structured data ready for frontend rendering.
        """

        prompt = self._build_intelligence_prompt(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            company_name=company_name,
            industry=industry,
            ai_profile=ai_profile,
            user_skills=user_skills
        )

        try:
            result = self.client.generate_structured(
                prompt=prompt,
                schema=self.INTELLIGENCE_SCHEMA,
                temperature=0.15,
                max_output_tokens=4096,
                system_instruction=self.SYSTEM_INSTRUCTION
            )

            if result.get("success") and result.get("parsed_as_json"):
                intelligence_data = result["data"]

                # Validate all required top-level keys
                required_keys = [
                    "overallMatchScore", "matchSummary", "matchCategory", "strengths",
                    "weaknesses", "skillGapAnalysis", "experienceAnalysis", "educationAnalysis",
                    "atsCompatibility", "recommendedImprovements", "interviewPreparation",
                    "careerGrowthAdvice", "learningRecommendations", "personalizedNextSteps"
                ]

                for key in required_keys:
                    if key not in intelligence_data:
                        intelligence_data[key] = self._get_fallback_section(key)

                return {
                    "success": True,
                    "data": intelligence_data,
                    "source": "gemini_ai_v2",
                    "model": result.get("model", "unknown"),
                    "cached": False,
                    "phase": 2
                }

            return self._handle_unstructured_response(result)

        except (GeminiAPIError, GeminiTimeoutError, GeminiParsingError) as e:
            logger.error(f"Gemini API error in Phase 2 intelligence: {str(e)}")
            return self._get_degraded_response(str(e))
        except Exception as e:
            logger.exception("Unexpected error in Phase 2 intelligence generation")
            return self._get_degraded_response(str(e))

    def generate_quick_insight(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        ai_profile: Optional[AIProfile] = None
    ) -> Dict[str, Any]:
        """
        Lightweight quick insight for rapid feedback.
        Lower token usage, faster response.
        """

        profile_summary = ""
        if ai_profile:
            profile_summary = f"""
Candidate: {ai_profile.current_role or 'Unknown'}, {ai_profile.years_of_experience or 'Unknown'} years
Top Skills: {', '.join(ai_profile.get_json_field('technical_skills')[:5])}
"""

        prompt = f"""Quick career match assessment. Respond with JSON only.

{profile_summary}
CV Summary: {cv_text[:1500]}

Job: {job_title}
Description: {job_description[:1500]}

Return JSON with:
- matchScore (0-100)
- matchCategory (Excellent/Good/Fair/Poor)
- oneLineSummary (string)
- topStrength (string)
- topGap (string)
- timeToPrepareWeeks (number)
- oneKeyAction (string)"""

        try:
            result = self.client.generate_structured(
                prompt=prompt,
                temperature=0.1,
                max_output_tokens=512
            )

            if result.get("success") and result.get("parsed_as_json"):
                return {
                    "success": True,
                    "data": result["data"],
                    "source": "gemini_ai_v2_quick"
                }

            return {
                "success": False,
                "data": {"matchScore": 0, "matchCategory": "Unknown"},
                "error": "Failed to parse quick insight"
            }

        except Exception as e:
            logger.error(f"Quick insight failed: {str(e)}")
            return {
                "success": False,
                "data": {"matchScore": 0, "matchCategory": "Unknown"},
                "error": str(e)
            }

    def _handle_unstructured_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Handle non-JSON responses by wrapping raw text with fallback structure."""
        raw_text = result.get("raw_text", "")
        logger.warning(f"Unstructured Phase 2 response. Length: {len(raw_text)}")

        return {
            "success": True,
            "data": {
                "overallMatchScore": 0,
                "matchSummary": "Unable to generate structured analysis. Raw response available.",
                "matchCategory": "Unknown",
                "strengths": [],
                "weaknesses": ["Analysis parsing failed"],
                "missingSkills": [],
                "skillGapAnalysis": {
                    "matchedSkills": [],
                    "missingSkills": [],
                    "transferableSkills": [],
                    "skillMatchPercentage": 0,
                    "recommendedLearning": []
                },
                "experienceAnalysis": {
                    "experienceMatch": "Unknown",
                    "relevantExperience": "Analysis unavailable",
                    "experienceGaps": [],
                    "keyAchievements": []
                },
                "educationAnalysis": {
                    "educationMatch": "Unknown",
                    "certificationsValue": [],
                    "recommendedCertifications": []
                },
                "atsCompatibility": {
                    "score": 0,
                    "issues": ["Analysis unavailable"],
                    "recommendations": []
                },
                "recommendedImprovements": [],
                "interviewPreparation": {
                    "likelyQuestions": [],
                    "technicalTopics": [],
                    "behavioralAngles": [],
                    "preparationTimeDays": 0
                },
                "salaryInsight": {
                    "marketRange": "Unknown",
                    "candidatePositioning": "Analysis unavailable",
                    "negotiationTips": []
                },
                "careerGrowthAdvice": {
                    "roleTrajectory": "Analysis unavailable",
                    "nextRole": "Unknown",
                    "longTermPath": "Analysis unavailable",
                    "industryTrends": []
                },
                "learningRecommendations": [],
                "personalizedNextSteps": [],
                "rawAnalysis": raw_text,
                "parseError": True
            },
            "source": "gemini_ai_v2_fallback",
            "model": result.get("model", "unknown"),
            "cached": False,
            "phase": 2
        }

    def _get_degraded_response(self, error_message: str) -> Dict[str, Any]:
        """
        Graceful degradation when AI service is unavailable.
        Preserves API contract for frontend compatibility.
        """

        return {
            "success": False,
            "data": {
                "overallMatchScore": 0,
                "matchSummary": "AI analysis service temporarily unavailable. Please retry shortly.",
                "matchCategory": "Analysis Unavailable",
                "strengths": [],
                "weaknesses": ["Service temporarily unavailable"],
                "missingSkills": [],
                "skillGapAnalysis": {
                    "matchedSkills": [],
                    "missingSkills": [],
                    "transferableSkills": [],
                    "skillMatchPercentage": 0,
                    "recommendedLearning": []
                },
                "experienceAnalysis": {
                    "experienceMatch": "Unknown",
                    "relevantExperience": "Service temporarily unavailable",
                    "experienceGaps": [],
                    "keyAchievements": []
                },
                "educationAnalysis": {
                    "educationMatch": "Unknown",
                    "certificationsValue": [],
                    "recommendedCertifications": []
                },
                "atsCompatibility": {
                    "score": 0,
                    "issues": ["Service temporarily unavailable"],
                    "recommendations": ["Retry analysis"]
                },
                "recommendedImprovements": [],
                "interviewPreparation": {
                    "likelyQuestions": [],
                    "technicalTopics": [],
                    "behavioralAngles": [],
                    "preparationTimeDays": 0
                },
                "salaryInsight": {
                    "marketRange": "Unknown",
                    "candidatePositioning": "Service unavailable",
                    "negotiationTips": []
                },
                "careerGrowthAdvice": {
                    "roleTrajectory": "Unable to determine",
                    "nextRole": "Unknown",
                    "longTermPath": "Unable to determine",
                    "industryTrends": []
                },
                "learningRecommendations": [],
                "personalizedNextSteps": [
                    {
                        "step": 1,
                        "action": "Retry AI analysis",
                        "timeline": "Now",
                        "expectedOutcome": "Full career intelligence report"
                    }
                ],
                "error": error_message,
                "serviceAvailable": False
            },
            "source": "degraded_fallback_v2",
            "model": "none",
            "cached": False,
            "phase": 2
        }

    def _get_fallback_section(self, section_name: str) -> Any:
        """Return empty fallback section matching expected schema."""

        fallbacks = {
            "overallMatchScore": 0,
            "matchSummary": "Section data unavailable",
            "matchCategory": "Unknown",
            "strengths": [],
            "weaknesses": ["Section data unavailable"],
            "missingSkills": [],
            "skillGapAnalysis": {
                "matchedSkills": [],
                "missingSkills": [],
                "transferableSkills": [],
                "skillMatchPercentage": 0,
                "recommendedLearning": []
            },
            "experienceAnalysis": {
                "experienceMatch": "Unknown",
                "relevantExperience": "Data unavailable",
                "experienceGaps": [],
                "keyAchievements": []
            },
            "educationAnalysis": {
                "educationMatch": "Unknown",
                "certificationsValue": [],
                "recommendedCertifications": []
            },
            "atsCompatibility": {
                "score": 0,
                "issues": ["Analysis incomplete"],
                "recommendations": []
            },
            "recommendedImprovements": [],
            "interviewPreparation": {
                "likelyQuestions": [],
                "technicalTopics": [],
                "behavioralAngles": [],
                "preparationTimeDays": 0
            },
            "salaryInsight": {
                "marketRange": "Unknown",
                "candidatePositioning": "Data unavailable",
                "negotiationTips": []
            },
            "careerGrowthAdvice": {
                "roleTrajectory": "Data unavailable",
                "nextRole": "Unknown",
                "longTermPath": "Data unavailable",
                "industryTrends": []
            },
            "learningRecommendations": [],
            "personalizedNextSteps": [
                {
                    "step": 1,
                    "action": "Complete analysis for full report",
                    "timeline": "Soon",
                    "expectedOutcome": "Complete career intelligence"
                }
            ]
        }

        return fallbacks.get(section_name, {})


# Singleton instance
_career_intelligence_engine: Optional[AICareerIntelligenceEngine] = None


def get_career_intelligence_engine() -> AICareerIntelligenceEngine:
    """Get or create the singleton Phase 2 engine."""
    global _career_intelligence_engine
    if _career_intelligence_engine is None:
        _career_intelligence_engine = AICareerIntelligenceEngine()
    return _career_intelligence_engine


def generate_full_career_intelligence(
    cv_text: str,
    job_title: str,
    job_description: str,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    ai_profile: Optional[AIProfile] = None,
    user_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Convenience function for full Phase 2 intelligence."""
    engine = get_career_intelligence_engine()
    return engine.generate_full_intelligence(
        cv_text=cv_text,
        job_title=job_title,
        job_description=job_description,
        company_name=company_name,
        industry=industry,
        ai_profile=ai_profile,
        user_skills=user_skills
    )


def generate_quick_career_insight(
    cv_text: str,
    job_title: str,
    job_description: str,
    ai_profile: Optional[AIProfile] = None
) -> Dict[str, Any]:
    """Convenience function for quick Phase 2 insight."""
    engine = get_career_intelligence_engine()
    return engine.generate_quick_insight(
        cv_text=cv_text,
        job_title=job_title,
        job_description=job_description,
        ai_profile=ai_profile
    )