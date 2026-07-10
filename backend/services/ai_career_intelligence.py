"""
AI Career Intelligence Service
Phase 1 + Phase 3: Career Roadmap & Skill Gap Intelligence
Generates structured AI Career Intelligence and personalized learning roadmaps.

Uses centralized GeminiClient from clients.gemini_client.
Model name is read from config.Config.GEMINI_MODEL (single source of truth).
"""

import json
import logging
from typing import Dict, List, Any, Optional

from clients.gemini_client import GeminiClient, GeminiAPIError, GeminiTimeoutError, GeminiParsingError
from models import AIProfile

logger = logging.getLogger(__name__)


class AICareerIntelligenceService:
    """
    Service layer for AI Career Intelligence.
    Orchestrates Gemini API calls to generate comprehensive career insights
    and personalized learning roadmaps.
    """

    # Phase 1: Basic intelligence schema
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

    # Phase 3: Career Roadmap & Skill Gap Schema
    CAREER_ROADMAP_SCHEMA = {
        "type": "object",
        "properties": {
            "missingTechnicalSkills": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "skill": {"type": "string"},
                        "currentLevel": {"type": "string", "enum": ["None", "Basic", "Intermediate"]},
                        "targetLevel": {"type": "string", "enum": ["Intermediate", "Advanced", "Expert"]},
                        "gapDescription": {"type": "string"},
                        "learningPriority": {"type": "number", "minimum": 1, "maximum": 10},
                        "estimatedWeeks": {"type": "number", "minimum": 1},
                        "prerequisites": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["skill", "learningPriority", "estimatedWeeks"]
                }
            },
            "missingSoftSkills": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "skill": {"type": "string"},
                        "gapDescription": {"type": "string"},
                        "improvementMethod": {"type": "string"},
                        "learningPriority": {"type": "number", "minimum": 1, "maximum": 10}
                    },
                    "required": ["skill", "learningPriority"]
                }
            },
            "learningPriority": {
                "type": "object",
                "properties": {
                    "highPriority": {"type": "array", "items": {"type": "string"}},
                    "mediumPriority": {"type": "array", "items": {"type": "string"}},
                    "lowPriority": {"type": "array", "items": {"type": "string"}},
                    "rationale": {"type": "string"}
                },
                "required": ["highPriority", "mediumPriority", "lowPriority"]
            },
            "estimatedTimeline": {
                "type": "object",
                "properties": {
                    "totalWeeks": {"type": "number"},
                    "phases": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "phase": {"type": "number"},
                                "name": {"type": "string"},
                                "durationWeeks": {"type": "number"},
                                "skills": {"type": "array", "items": {"type": "string"}},
                                "deliverables": {"type": "array", "items": {"type": "string"}}
                            },
                            "required": ["phase", "name", "durationWeeks", "skills"]
                        }
                    },
                    "milestones": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "week": {"type": "number"},
                                "achievement": {"type": "string"}
                            },
                            "required": ["week", "achievement"]
                        }
                    }
                },
                "required": ["totalWeeks", "phases"]
            },
            "recommendedCertifications": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "provider": {"type": "string"},
                        "relevanceScore": {"type": "number", "minimum": 0, "maximum": 100},
                        "estimatedCost": {"type": "string"},
                        "estimatedDuration": {"type": "string"},
                        "careerImpact": {"type": "string"}
                    },
                    "required": ["name", "provider", "relevanceScore"]
                }
            },
            "recommendedPortfolioProjects": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "technologies": {"type": "array", "items": {"type": "string"}},
                        "complexity": {"type": "string", "enum": ["Beginner", "Intermediate", "Advanced"]},
                        "estimatedHours": {"type": "number"},
                        "learningOutcomes": {"type": "array", "items": {"type": "string"}},
                        "portfolioValue": {"type": "string"}
                    },
                    "required": ["title", "description", "technologies", "complexity"]
                }
            },
            "nextCareerRole": {
                "type": "object",
                "properties": {
                    "role": {"type": "string"},
                    "timeline": {"type": "string"},
                    "requirements": {"type": "array", "items": {"type": "string"}},
                    "salaryRange": {"type": "string"},
                    "progressionPath": {"type": "string"}
                },
                "required": ["role", "timeline", "requirements"]
            },
            "salaryProjection": {
                "type": "object",
                "properties": {
                    "currentEstimate": {"type": "string"},
                    "afterSkillAcquisition": {"type": "string"},
                    "growthPercentage": {"type": "number"},
                    "marketRange": {"type": "string"},
                    "factors": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["currentEstimate", "afterSkillAcquisition", "growthPercentage"]
            },
            "personalizedRoadmap": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "step": {"type": "number"},
                        "action": {"type": "string"},
                        "timeline": {"type": "string"},
                        "resources": {"type": "array", "items": {"type": "string"}},
                        "expectedOutcome": {"type": "string"},
                        "completionCriteria": {"type": "string"}
                    },
                    "required": ["step", "action", "timeline"]
                }
            },
            "actionableNextSteps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "step": {"type": "number"},
                        "action": {"type": "string"},
                        "urgency": {"type": "string", "enum": ["Immediate", "This Week", "This Month"]},
                        "impact": {"type": "string", "enum": ["High", "Medium", "Low"]},
                        "timeInvestment": {"type": "string"},
                        "expectedOutcome": {"type": "string"}
                    },
                    "required": ["step", "action", "urgency", "impact"]
                }
            }
        },
        "required": [
            "missingTechnicalSkills",
            "missingSoftSkills",
            "learningPriority",
            "estimatedTimeline",
            "recommendedCertifications",
            "recommendedPortfolioProjects",
            "nextCareerRole",
            "salaryProjection",
            "personalizedRoadmap",
            "actionableNextSteps"
        ]
    }

    SYSTEM_INSTRUCTION = """You are an expert AI Career Intelligence analyst with 20+ years of experience in technical recruiting, career coaching, and talent strategy. Your analysis is data-driven, actionable, and tailored to the specific candidate and role. You provide honest, constructive assessments that help candidates make informed career decisions."""

    ROADMAP_SYSTEM_INSTRUCTION = """You are an elite career development strategist and technical skills architect with 20+ years of experience at Google, Amazon, Microsoft, and Meta. You specialize in creating personalized, actionable learning roadmaps that bridge skill gaps and accelerate career growth.

Your roadmaps are:
1. PERSONALIZED: Every recommendation is tailored to the candidate's current skills, experience level, and target role
2. REALISTIC: Timelines and expectations are grounded in real-world learning curves
3. MARKET-ALIGNED: Skills and certifications reflect current industry demand and salary impact
4. ACTIONABLE: Each step includes specific resources, deliverables, and completion criteria
5. HONEST: You don't sugarcoat gaps, but you provide clear paths to close them

You understand that:
- Learning takes time: 40-60 hours for basic proficiency, 100-200 hours for advanced
- Portfolio projects are the best proof of skill
- Certifications matter most when they validate hands-on experience
- Soft skills often determine promotion velocity more than technical skills
- Salary growth follows skill acquisition, not just years of experience"""

    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.client = gemini_client or GeminiClient()

    # ==================== PHASE 1 METHODS (PRESERVED) ====================

    def _build_intelligence_prompt(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        company_name: Optional[str] = None,
        industry: Optional[str] = None,
        user_skills: Optional[List[str]] = None
    ) -> str:
        """Construct the prompt for career intelligence generation (Phase 1)."""
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
        Phase 1: Generate comprehensive AI Career Intelligence.
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

            return self._handle_unstructured_response(result)

        except (GeminiAPIError, GeminiTimeoutError, GeminiParsingError) as e:
            logger.error(f"Gemini API error in career intelligence: {str(e)}")
            return self._get_degraded_response(str(e))
        except Exception as e:
            logger.exception("Unexpected error in career intelligence generation")
            return self._get_degraded_response(str(e))

    # ==================== PHASE 3 METHODS (PRESERVED) ====================

    def _build_roadmap_prompt(
        self,
        cv_text: str,
        job_title: str,
        job_description: str,
        company_name: Optional[str] = None,
        industry: Optional[str] = None,
        ai_profile: Optional[AIProfile] = None,
        user_skills: Optional[List[str]] = None
    ) -> str:
        """Construct the prompt for career roadmap generation (Phase 3)."""

        profile_section = ""
        if ai_profile:
            profile_section = f"""
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

        skills_section = ""
        if user_skills:
            skills_section = f"\n=== EXTRACTED USER SKILLS ===\n{', '.join(user_skills)}\n"

        company_section = f"Company: {company_name}\n" if company_name else ""
        industry_section = f"Industry: {industry}\n" if industry else ""

        prompt = f"""Create a personalized career roadmap and skill gap analysis for the following candidate targeting this specific role.

=== CANDIDATE CV ===
{cv_text[:5000]}

{profile_section}

=== TARGET JOB ===
Title: {job_title}
{company_section}{industry_section}

Job Description:
{job_description[:5000]}
{skills_section}

=== INSTRUCTIONS ===
Generate a comprehensive, personalized career roadmap as valid JSON. This must be SPECIFIC to this candidate and role — no generic advice.

SCORING & TIMELINE GUIDELINES:
- Learning Priority: 1-10 scale (10 = critical for this role, 1 = nice to have)
- Estimated Weeks: Realistic based on complexity (basic skill: 2-4 weeks, advanced: 8-16 weeks)
- Total Timeline: Sum of all phases, typically 12-24 weeks for significant skill gaps
- Portfolio Projects: Must use technologies the candidate needs to learn, with clear complexity levels

SALARY PROJECTION GUIDELINES:
- Current Estimate: Based on candidate's current role, skills, and location
- After Skill Acquisition: Realistic market rate after completing roadmap
- Growth Percentage: Typically 15-40% for significant skill acquisition
- Factor in: location, years of experience, certification value, portfolio strength

NEXT CAREER ROLE:
- Suggest the logical next role after mastering missing skills
- Include timeline (e.g., "6-12 months after completing roadmap")
- List specific requirements for that next role

ACTIONABLE NEXT STEPS:
- Step 1: Immediate (today/this week) — highest impact, lowest time
- Step 2: This Week — foundational skill building
- Step 3: This Month — portfolio project or certification

Respond with valid JSON ONLY. No markdown, no explanations outside JSON."""

        return prompt

    def generate_career_roadmap(
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
        Phase 3: Generate personalized career roadmap and skill gap analysis.
        Returns structured learning plan, certifications, projects, and career trajectory.
        """
        prompt = self._build_roadmap_prompt(
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
                schema=self.CAREER_ROADMAP_SCHEMA,
                temperature=0.15,
                max_output_tokens=4096,
                system_instruction=self.ROADMAP_SYSTEM_INSTRUCTION
            )

            if result.get("success") and result.get("parsed_as_json"):
                roadmap_data = result["data"]

                required_keys = [
                    "missingTechnicalSkills", "missingSoftSkills", "learningPriority",
                    "estimatedTimeline", "recommendedCertifications", "recommendedPortfolioProjects",
                    "nextCareerRole", "salaryProjection", "personalizedRoadmap", "actionableNextSteps"
                ]
                for key in required_keys:
                    if key not in roadmap_data:
                        roadmap_data[key] = self._get_roadmap_fallback(key)

                return {
                    "success": True,
                    "data": roadmap_data,
                    "source": "gemini_ai_roadmap",
                    "model": result.get("model", "unknown"),
                    "cached": False,
                    "phase": 3
                }

            return self._handle_roadmap_unstructured(result)

        except (GeminiAPIError, GeminiTimeoutError, GeminiParsingError) as e:
            logger.error(f"Gemini API error in career roadmap: {str(e)}")
            return self._get_roadmap_degraded(str(e))
        except Exception as e:
            logger.exception("Unexpected error in career roadmap generation")
            return self._get_roadmap_degraded(str(e))

    def generate_combined_intelligence(
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
        Generate both Phase 1 intelligence AND Phase 3 roadmap in a single call.
        Optimized for frontend consumption with all data in one response.
        """
        profile_section = ""
        if ai_profile:
            profile_section = f"""
Current Role: {ai_profile.current_role or 'Unknown'}
Years Experience: {ai_profile.years_of_experience or 'Unknown'}
Technical Skills: {', '.join(ai_profile.get_json_field('technical_skills')[:15])}
"""

        prompt = f"""Generate a comprehensive career intelligence report AND personalized learning roadmap for this candidate.

=== CANDIDATE ===
{cv_text[:4000]}
{profile_section}

=== TARGET JOB ===
Title: {job_title}
Company: {company_name or 'Unknown'}
Industry: {industry or 'Unknown'}

Description:
{job_description[:4000]}

=== OUTPUT FORMAT ===
Return a single JSON object with two top-level keys:

1. "intelligence" - Contains:
   - overallMatchScore (0-100)
   - matchSummary (2-3 sentences)
   - matchCategory (Excellent/Good/Fair/Poor)
   - strengths (array of strings)
   - weaknesses (array of strings)
   - skillGapAnalysis (object with matchedSkills, missingSkills, skillMatchPercentage)
   - experienceAnalysis (object with experienceMatch, relevantExperience)
   - educationAnalysis (object with educationMatch)
   - atsCompatibility (object with score, issues, recommendations)
   - recommendedImprovements (array of objects with area, priority, action, impact)
   - interviewPreparation (object with likelyQuestions, technicalTopics, behavioralAngles)
   - salaryInsight (object with marketRange, candidatePositioning, negotiationTips)
   - careerGrowthAdvice (object with roleTrajectory, nextRole, longTermPath, industryTrends)

2. "roadmap" - Contains:
   - missingTechnicalSkills (array with skill, currentLevel, targetLevel, gapDescription, learningPriority, estimatedWeeks, prerequisites)
   - missingSoftSkills (array with skill, gapDescription, improvementMethod, learningPriority)
   - learningPriority (object with highPriority, mediumPriority, lowPriority arrays, rationale)
   - estimatedTimeline (object with totalWeeks, phases array with phase/name/durationWeeks/skills/deliverables, milestones array)
   - recommendedCertifications (array with name, provider, relevanceScore, estimatedCost, estimatedDuration, careerImpact)
   - recommendedPortfolioProjects (array with title, description, technologies, complexity, estimatedHours, learningOutcomes, portfolioValue)
   - nextCareerRole (object with role, timeline, requirements, salaryRange, progressionPath)
   - salaryProjection (object with currentEstimate, afterSkillAcquisition, growthPercentage, marketRange, factors)
   - personalizedRoadmap (array with step, action, timeline, resources, expectedOutcome, completionCriteria)
   - actionableNextSteps (array with step, action, urgency, impact, timeInvestment, expectedOutcome)

Be specific, realistic, and personalized. No generic advice."""

        try:
            result = self.client.generate_structured(
                prompt=prompt,
                temperature=0.15,
                max_output_tokens=4096,
                system_instruction=self.ROADMAP_SYSTEM_INSTRUCTION
            )

            if result.get("success") and result.get("parsed_as_json"):
                data = result["data"]

                if "intelligence" not in data:
                    data["intelligence"] = self._get_fallback_intelligence()
                if "roadmap" not in data:
                    data["roadmap"] = self._get_fallback_roadmap()

                return {
                    "success": True,
                    "data": data,
                    "source": "gemini_ai_combined",
                    "model": result.get("model", "unknown"),
                    "cached": False,
                    "phase": "1+3"
                }

            return {
                "success": False,
                "data": {
                    "intelligence": self._get_fallback_intelligence(),
                    "roadmap": self._get_fallback_roadmap()
                },
                "error": "Failed to parse combined response",
                "raw": result.get("raw_text", "")[:500]
            }

        except Exception as e:
            logger.exception("Combined intelligence generation failed")
            return {
                "success": False,
                "data": {
                    "intelligence": self._get_fallback_intelligence(),
                    "roadmap": self._get_fallback_roadmap()
                },
                "error": str(e)
            }

    # ==================== FALLBACK METHODS (PRESERVED) ====================

    def _handle_unstructured_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Handle non-JSON responses for Phase 1."""
        raw_text = result.get("raw_text", "")
        logger.warning(f"Unstructured response from Gemini. Length: {len(raw_text)}")

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

    def _handle_roadmap_unstructured(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Handle non-JSON responses for Phase 3."""
        raw_text = result.get("raw_text", "")
        logger.warning(f"Unstructured roadmap response. Length: {len(raw_text)}")

        return {
            "success": True,
            "data": {
                "missingTechnicalSkills": [],
                "missingSoftSkills": [],
                "learningPriority": {"highPriority": [], "mediumPriority": [], "lowPriority": [], "rationale": "Analysis unavailable"},
                "estimatedTimeline": {"totalWeeks": 0, "phases": [], "milestones": []},
                "recommendedCertifications": [],
                "recommendedPortfolioProjects": [],
                "nextCareerRole": {"role": "Unknown", "timeline": "Unknown", "requirements": []},
                "salaryProjection": {"currentEstimate": "Unknown", "afterSkillAcquisition": "Unknown", "growthPercentage": 0},
                "personalizedRoadmap": [],
                "actionableNextSteps": [],
                "rawAnalysis": raw_text,
                "parseError": True
            },
            "source": "gemini_ai_roadmap_fallback",
            "model": result.get("model", "unknown"),
            "cached": False,
            "phase": 3
        }

    def _get_degraded_response(self, error_message: str) -> Dict[str, Any]:
        """Graceful degradation for Phase 1."""
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

    def _get_roadmap_degraded(self, error_message: str) -> Dict[str, Any]:
        """Graceful degradation for Phase 3."""
        return {
            "success": False,
            "data": {
                "missingTechnicalSkills": [],
                "missingSoftSkills": [],
                "learningPriority": {"highPriority": [], "mediumPriority": [], "lowPriority": [], "rationale": "Service unavailable"},
                "estimatedTimeline": {"totalWeeks": 0, "phases": [], "milestones": []},
                "recommendedCertifications": [],
                "recommendedPortfolioProjects": [],
                "nextCareerRole": {"role": "Unknown", "timeline": "Unknown", "requirements": []},
                "salaryProjection": {"currentEstimate": "Unknown", "afterSkillAcquisition": "Unknown", "growthPercentage": 0, "marketRange": "Unknown", "factors": []},
                "personalizedRoadmap": [
                    {"step": 1, "action": "Retry AI analysis", "timeline": "Now", "resources": [], "expectedOutcome": "Full career roadmap", "completionCriteria": "Successful API response"}
                ],
                "actionableNextSteps": [
                    {"step": 1, "action": "Check network connection and retry", "urgency": "Immediate", "impact": "High", "timeInvestment": "1 minute", "expectedOutcome": "Restore AI service"}
                ],
                "error": error_message,
                "serviceAvailable": False
            },
            "source": "degraded_roadmap_fallback",
            "model": "none",
            "cached": False,
            "phase": 3
        }

    def _get_fallback_section(self, section_name: str) -> Any:
        """Return empty fallback section for Phase 1."""
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

    def _get_roadmap_fallback(self, section_name: str) -> Any:
        """Return empty fallback section for Phase 3."""
        fallbacks = {
            "missingTechnicalSkills": [],
            "missingSoftSkills": [],
            "learningPriority": {"highPriority": [], "mediumPriority": [], "lowPriority": [], "rationale": "Data unavailable"},
            "estimatedTimeline": {"totalWeeks": 0, "phases": [], "milestones": []},
            "recommendedCertifications": [],
            "recommendedPortfolioProjects": [],
            "nextCareerRole": {"role": "Unknown", "timeline": "Unknown", "requirements": [], "salaryRange": "Unknown", "progressionPath": "Unknown"},
            "salaryProjection": {"currentEstimate": "Unknown", "afterSkillAcquisition": "Unknown", "growthPercentage": 0, "marketRange": "Unknown", "factors": []},
            "personalizedRoadmap": [],
            "actionableNextSteps": []
        }
        return fallbacks.get(section_name, [] if "Skills" in section_name or "Projects" in section_name or "Certifications" in section_name or "Roadmap" in section_name or "Steps" in section_name else {})

    def _get_fallback_intelligence(self) -> Dict[str, Any]:
        """Return fallback intelligence section for combined response."""
        return {
            "overallMatchScore": 0,
            "matchSummary": "Analysis temporarily unavailable",
            "matchCategory": "Unknown",
            "strengths": [],
            "weaknesses": ["Service unavailable"],
            "skillGapAnalysis": {"matchedSkills": [], "missingSkills": [], "skillMatchPercentage": 0},
            "experienceAnalysis": {"experienceMatch": "Unknown", "relevantExperience": "Unavailable"},
            "educationAnalysis": {"educationMatch": "Unknown"},
            "atsCompatibility": {"score": 0, "issues": [], "recommendations": []},
            "recommendedImprovements": [],
            "interviewPreparation": {"likelyQuestions": [], "technicalTopics": [], "behavioralAngles": []},
            "salaryInsight": {"marketRange": "Unknown", "candidatePositioning": "Unknown", "negotiationTips": []},
            "careerGrowthAdvice": {"roleTrajectory": "Unknown", "nextRole": "Unknown", "longTermPath": "Unknown", "industryTrends": []}
        }

    def _get_fallback_roadmap(self) -> Dict[str, Any]:
        """Return fallback roadmap section for combined response."""
        return {
            "missingTechnicalSkills": [],
            "missingSoftSkills": [],
            "learningPriority": {"highPriority": [], "mediumPriority": [], "lowPriority": [], "rationale": "Unavailable"},
            "estimatedTimeline": {"totalWeeks": 0, "phases": [], "milestones": []},
            "recommendedCertifications": [],
            "recommendedPortfolioProjects": [],
            "nextCareerRole": {"role": "Unknown", "timeline": "Unknown", "requirements": []},
            "salaryProjection": {"currentEstimate": "Unknown", "afterSkillAcquisition": "Unknown", "growthPercentage": 0},
            "personalizedRoadmap": [],
            "actionableNextSteps": []
        }

    def quick_match_score(
        self,
        cv_text: str,
        job_title: str,
        job_description: str
    ) -> Dict[str, Any]:
        """Phase 1: Lightweight quick match scoring."""
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


# ── Singleton & Convenience Functions ──────────────────────────────────────────

_career_intelligence_service: Optional[AICareerIntelligenceService] = None


def get_career_intelligence_service(gemini_client: Optional[GeminiClient] = None) -> AICareerIntelligenceService:
    """Get or create the singleton career intelligence service."""
    global _career_intelligence_service
    if _career_intelligence_service is None:
        _career_intelligence_service = AICareerIntelligenceService(gemini_client=gemini_client)
    return _career_intelligence_service


def generate_career_intelligence(
    cv_text: str,
    job_title: str,
    job_description: str,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    user_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Phase 1: Generate full AI Career Intelligence report."""
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
    """Phase 1: Quick match scoring."""
    service = get_career_intelligence_service()
    return service.quick_match_score(cv_text, job_title, job_description)


def generate_career_roadmap(
    cv_text: str,
    job_title: str,
    job_description: str,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    ai_profile: Optional[Any] = None,
    user_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Phase 3: Generate personalized career roadmap and skill gap analysis."""
    service = get_career_intelligence_service()
    return service.generate_career_roadmap(
        cv_text=cv_text,
        job_title=job_title,
        job_description=job_description,
        company_name=company_name,
        industry=industry,
        ai_profile=ai_profile,
        user_skills=user_skills
    )


def generate_combined_intelligence(
    cv_text: str,
    job_title: str,
    job_description: str,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    ai_profile: Optional[Any] = None,
    user_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Phase 3: Generate both intelligence and roadmap in one call."""
    service = get_career_intelligence_service()
    return service.generate_combined_intelligence(
        cv_text=cv_text,
        job_title=job_title,
        job_description=job_description,
        company_name=company_name,
        industry=industry,
        ai_profile=ai_profile,
        user_skills=user_skills
    )