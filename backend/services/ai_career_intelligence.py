"""
AI Career Intelligence Service
Generates structured AI Career Intelligence data using the centralized GeminiClient.
Input: User CV/Profile + Selected Job
Output: Structured intelligence for frontend consumption.
"""

import json
import logging
from typing import Dict, List, Any, Optional

from clients.gemini_client import GeminiClient, GeminiAPIError, GeminiTimeoutError, GeminiParsingError

logger = logging.getLogger(__name__)


class AICareerIntelligenceService:
    """
    Service layer for AI Career Intelligence.
    Orchestrates Gemini API calls to generate comprehensive career insights.
    """
    
    # JSON schema for structured output validation
    CAREER_INTELLIGENCE_SCHEMA = {
        "type": "object",
        "properties": {
            "matchAnalysis": {
                "type": "object",
                "properties": {
                    "overallMatchScore": {"type": "number", "minimum": 0, "maximum": 100},
                    "matchCategory": {"type": "string", "enum": ["Excellent", "Good", "Fair", "Poor"]},
                    "keyStrengths": {"type": "array", "items": {"type": "string"}},
                    "criticalGaps": {"type": "array", "items": {"type": "string"}},
                    "quickWinActions": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["overallMatchScore", "matchCategory", "keyStrengths", "criticalGaps"]
            },
            "skillIntelligence": {
                "type": "object",
                "properties": {
                    "matchedSkills": {"type": "array", "items": {"type": "string"}},
                    "missingSkills": {"type": "array", "items": {"type": "string"}},
                    "transferableSkills": {"type": "array", "items": {"type": "string"}},
                    "skillsToHighlight": {"type": "array", "items": {"type": "string"}},
                    "recommendedSkillDevelopments": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["matchedSkills", "missingSkills"]
            },
            "experienceAlignment": {
                "type": "object",
                "properties": {
                    "yearsRequired": {"type": "number"},
                    "yearsCandidate": {"type": "number"},
                    "experienceMatch": {"type": "string", "enum": ["Strong", "Good", "Partial", "Insufficient"]},
                    "relevantExperience": {"type": "string"},
                    "experienceGaps": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["experienceMatch", "relevantExperience"]
            },
            "educationAlignment": {
                "type": "object",
                "properties": {
                    "degreeRequired": {"type": "string"},
                    "degreeCandidate": {"type": "string"},
                    "educationMatch": {"type": "string", "enum": ["Strong", "Good", "Partial", "Insufficient"]},
                    "certificationsValue": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["educationMatch"]
            },
            "strategicInsights": {
                "type": "object",
                "properties": {
                    "roleTrajectory": {"type": "string"},
                    "marketPositioning": {"type": "string"},
                    "salaryExpectation": {"type": "string"},
                    "negotiationLeverage": {"type": "array", "items": {"type": "string"}},
                    "longTermGrowth": {"type": "string"}
                },
                "required": ["roleTrajectory", "marketPositioning"]
            },
            "applicationStrategy": {
                "type": "object",
                "properties": {
                    "cvTailoringTips": {"type": "array", "items": {"type": "string"}},
                    "coverLetterAngles": {"type": "array", "items": {"type": "string"}},
                    "interviewPreparation": {"type": "array", "items": {"type": "string"}},
                    "networkingApproach": {"type": "string"}
                },
                "required": ["cvTailoringTips", "interviewPreparation"]
            },
            "riskAssessment": {
                "type": "object",
                "properties": {
                    "applicationRisk": {"type": "string", "enum": ["Low", "Medium", "High"]},
                    "keyRisks": {"type": "array", "items": {"type": "string"}},
                    "mitigationStrategies": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["applicationRisk"]
            }
        },
        "required": ["matchAnalysis", "skillIntelligence", "experienceAlignment", "strategicInsights"]
    }
    
    SYSTEM_INSTRUCTION = """You are an expert AI Career Intelligence analyst with 20+ years of experience in technical recruiting, career coaching, and talent strategy. Your analysis is data-driven, actionable, and tailored to the specific candidate and role. You provide honest, constructive assessments that help candidates make informed career decisions."""
    
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.client = gemini_client or GeminiClient()
    
    def _build_intelligence_prompt(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        company_name: Optional[str] = None,
        industry: Optional[str] = None,
        user_skills: Optional[List[str]] = None
    ) -> str:
        """Construct the prompt for career intelligence generation."""
        
        skills_section = ""
        if user_skills:
            skills_section = f"\nCandidate's Identified Skills: {', '.join(user_skills)}"
        
        company_section = f"\nCompany: {company_name}" if company_name else ""
        industry_section = f"\nIndustry: {industry}" if industry else ""
        
        prompt = f"""Analyze the following candidate profile against the job opportunity and generate comprehensive career intelligence.

=== CANDIDATE CV/PROFILE ===
{cv_text[:8000]}

=== JOB OPPORTUNITY ===
Title: {job_title}
{company_section}{industry_section}

Job Description:
{job_description[:6000]}
{skills_section}

=== INSTRUCTIONS ===
Generate a detailed career intelligence report as valid JSON. Be specific, actionable, and honest. Use real insights based on the actual content provided, not generic advice.

The response MUST be valid JSON matching the expected structure with these sections:
- matchAnalysis: Overall fit assessment with score (0-100), category, strengths, gaps, quick wins
- skillIntelligence: Detailed skill mapping including matched, missing, transferable, and recommended skills
- experienceAlignment: Years comparison, relevance assessment, gap analysis
- educationAlignment: Degree matching, certification recommendations
- strategicInsights: Career trajectory, market positioning, salary guidance, negotiation points
- applicationStrategy: Specific tips for CV tailoring, cover letter angles, interview prep
- riskAssessment: Honest evaluation of application success probability and risks

Be concise but specific. Every insight should be actionable."""
        
        return prompt
    
    def generate_career_intelligence(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        company_name: Optional[str] = None,
        industry: Optional[str] = None,
        user_skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive AI Career Intelligence for a candidate-job pairing.
        
        Returns structured data for frontend consumption with graceful degradation.
        """
        prompt = self._build_intelligence_prompt(
            cv_text=cv_text,
            job_title=job_title,
            job_description=job_description,
            company_name=company_name,
            industry=industry,
            user_skills=user_skills
        )
        
        try:
            result = self.client.generate_structured(
                prompt=prompt,
                schema=self.CAREER_INTELLIGENCE_SCHEMA,
                temperature=0.15,
                max_output_tokens=4096,
                system_instruction=self.SYSTEM_INSTRUCTION
            )
            
            if result.get("success") and result.get("parsed_as_json"):
                intelligence_data = result["data"]
                # Validate required top-level keys
                required_keys = ["matchAnalysis", "skillIntelligence", "experienceAlignment", "strategicInsights"]
                for key in required_keys:
                    if key not in intelligence_data:
                        intelligence_data[key] = self._get_fallback_section(key)
                
                return {
                    "success": True,
                    "data": intelligence_data,
                    "source": "gemini_ai",
                    "model": result.get("model", "unknown"),
                    "cached": False
                }
            
            # Fallback: parse raw text manually if JSON parsing failed
            return self._handle_unstructured_response(result)
            
        except (GeminiAPIError, GeminiTimeoutError, GeminiParsingError) as e:
            logger.error(f"Gemini API error in career intelligence: {str(e)}")
            return self._get_degraded_response(str(e))
        except Exception as e:
            logger.exception("Unexpected error in career intelligence generation")
            return self._get_degraded_response(str(e))
    
    def _handle_unstructured_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Handle non-JSON responses by wrapping raw text."""
        raw_text = result.get("raw_text", "")
        logger.warning(f"Unstructured response from Gemini, wrapping raw text. Length: {len(raw_text)}")
        
        return {
            "success": True,
            "data": {
                "matchAnalysis": {
                    "overallMatchScore": 0,
                    "matchCategory": "Unknown",
                    "keyStrengths": [],
                    "criticalGaps": ["Unable to parse structured analysis"],
                    "quickWinActions": ["Please retry the analysis"]
                },
                "skillIntelligence": {
                    "matchedSkills": [],
                    "missingSkills": [],
                    "transferableSkills": [],
                    "skillsToHighlight": [],
                    "recommendedSkillDevelopments": []
                },
                "experienceAlignment": {
                    "experienceMatch": "Unknown",
                    "relevantExperience": "Analysis unavailable",
                    "experienceGaps": []
                },
                "strategicInsights": {
                    "roleTrajectory": "Analysis unavailable",
                    "marketPositioning": "Analysis unavailable"
                },
                "rawAnalysis": raw_text,
                "parseError": True
            },
            "source": "gemini_ai_fallback",
            "model": result.get("model", "unknown"),
            "cached": False
        }
    
    def _get_degraded_response(self, error_message: str) -> Dict[str, Any]:
        """
        Return graceful degradation response when AI service is unavailable.
        Preserves API contract for frontend compatibility.
        """
        return {
            "success": False,
            "data": {
                "matchAnalysis": {
                    "overallMatchScore": 0,
                    "matchCategory": "Analysis Unavailable",
                    "keyStrengths": [],
                    "criticalGaps": ["AI analysis service temporarily unavailable"],
                    "quickWinActions": ["Retry in a few moments", "Check your network connection"]
                },
                "skillIntelligence": {
                    "matchedSkills": [],
                    "missingSkills": [],
                    "transferableSkills": [],
                    "skillsToHighlight": [],
                    "recommendedSkillDevelopments": []
                },
                "experienceAlignment": {
                    "experienceMatch": "Unknown",
                    "relevantExperience": "Service temporarily unavailable",
                    "experienceGaps": []
                },
                "strategicInsights": {
                    "roleTrajectory": "Unable to determine at this time",
                    "marketPositioning": "Unable to determine at this time"
                },
                "error": error_message,
                "serviceAvailable": False
            },
            "source": "degraded_fallback",
            "model": "none",
            "cached": False
        }
    
    def _get_fallback_section(self, section_name: str) -> Dict[str, Any]:
        """Return empty fallback section matching expected schema."""
        fallbacks = {
            "matchAnalysis": {
                "overallMatchScore": 0,
                "matchCategory": "Unknown",
                "keyStrengths": [],
                "criticalGaps": ["Section data unavailable"],
                "quickWinActions": []
            },
            "skillIntelligence": {
                "matchedSkills": [],
                "missingSkills": [],
                "transferableSkills": [],
                "skillsToHighlight": [],
                "recommendedSkillDevelopments": []
            },
            "experienceAlignment": {
                "experienceMatch": "Unknown",
                "relevantExperience": "Data unavailable",
                "experienceGaps": []
            },
            "educationAlignment": {
                "educationMatch": "Unknown",
                "certificationsValue": []
            },
            "strategicInsights": {
                "roleTrajectory": "Data unavailable",
                "marketPositioning": "Data unavailable"
            },
            "applicationStrategy": {
                "cvTailoringTips": [],
                "interviewPreparation": []
            },
            "riskAssessment": {
                "applicationRisk": "Medium",
                "keyRisks": ["Analysis incomplete"],
                "mitigationStrategies": ["Retry analysis for complete assessment"]
            }
        }
        return fallbacks.get(section_name, {})
    
    def quick_match_score(
        self,
        cv_text: str,
        job_title: str,
        job_description: str
    ) -> Dict[str, Any]:
        """
        Lightweight endpoint for quick match scoring without full intelligence.
        Faster, lower token usage.
        """
        prompt = f"""Quick match assessment. Respond with JSON only.

Candidate summary: {cv_text[:2000]}

Job: {job_title}
Description: {job_description[:2000]}

Return JSON with: matchScore (0-100), category (Excellent/Good/Fair/Poor), topMatchReason, topGap, timeToPrepareWeeks"""
        
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
                    "source": "gemini_ai_quick"
                }
            return {
                "success": False,
                "data": {"matchScore": 0, "category": "Unknown"},
                "error": "Failed to parse quick match"
            }
            
        except Exception as e:
            logger.error(f"Quick match failed: {str(e)}")
            return {
                "success": False,
                "data": {"matchScore": 0, "category": "Unknown"},
                "error": str(e)
            }


# Singleton instance for application-wide reuse
_career_intelligence_service: Optional[AICareerIntelligenceService] = None


def get_career_intelligence_service() -> AICareerIntelligenceService:
    """Get or create the singleton career intelligence service."""
    global _career_intelligence_service
    if _career_intelligence_service is None:
        _career_intelligence_service = AICareerIntelligenceService()
    return _career_intelligence_service


def generate_career_intelligence(
    cv_text: str,
    job_title: str,
    job_description: str,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    user_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Convenience function for direct service usage.
    Generates full AI Career Intelligence report.
    """
    service = get_career_intelligence_service()
    return service.generate_career_intelligence(
        cv_text=cv_text,
        job_title=job_title,
        job_description=job_description,
        company_name=company_name,
        industry=industry,
        user_skills=user_skills
    )


def quick_match_score(
    cv_text: str,
    job_title: str,
    job_description: str
) -> Dict[str, Any]:
    """Convenience function for quick match scoring."""
    service = get_career_intelligence_service()
    return service.quick_match_score(cv_text, job_title, job_description)