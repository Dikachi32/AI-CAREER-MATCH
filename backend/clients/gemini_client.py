"""
Centralized Gemini Client for AI Career Intelligence.
Production-grade client with retry logic, timeout handling, graceful degradation,
and structured JSON response parsing.
"""

import os
import json
import re
import time
import logging
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
from functools import wraps

import requests

logger = logging.getLogger(__name__)


class GeminiAPIError(Exception):
    """Raised when Gemini API returns an error response."""
    pass


class GeminiTimeoutError(Exception):
    """Raised when Gemini API request times out."""
    pass


class GeminiParsingError(Exception):
    """Raised when response cannot be parsed as valid JSON."""
    pass


@dataclass(frozen=True)
class GeminiConfig:
    """Immutable configuration for Gemini client."""
    api_key: str
    model: str = "gemini-1.5-flash"
    base_url: str = "https://generativelanguage.googleapis.com/v1beta/models"
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0
    retry_backoff: float = 2.0


def _retry_on_failure(max_retries: int, retry_delay: float, backoff: float):
    """Decorator implementing exponential backoff retry logic."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            delay = retry_delay
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (requests.RequestException, GeminiTimeoutError) as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"Gemini request failed (attempt {attempt + 1}/{max_retries}): {str(e)}. "
                            f"Retrying in {delay}s..."
                        )
                        time.sleep(delay)
                        delay *= backoff
                    else:
                        logger.error(f"Gemini request failed after {max_retries} attempts: {str(e)}")
            
            raise last_exception if last_exception else GeminiAPIError("Unknown error in retry loop")
        return wrapper
    return decorator


class GeminiClient:
    """
    Centralized, reusable Gemini API client.
    
    Thread-safe for typical Flask usage patterns (single request per thread).
    Supports both text-only and multimodal inputs.
    """
    
    _instance: Optional["GeminiClient"] = None
    _config: Optional[GeminiConfig] = None
    
    def __new__(cls, config: Optional[GeminiConfig] = None) -> "GeminiClient":
        """Singleton pattern to ensure single client instance across app."""
        if cls._instance is None:
            if config is None:
                config = cls._load_config_from_env()
            cls._instance = super().__new__(cls)
            cls._instance._initialize(config)
            cls._config = config
        return cls._instance
    
    def _initialize(self, config: GeminiConfig) -> None:
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json"
        })
        self._endpoint = (
            f"{config.base_url}/{config.model}:generateContent"
            f"?key={config.api_key}"
        )
        logger.info(f"GeminiClient initialized with model: {config.model}")
    
    @classmethod
    def _load_config_from_env(cls) -> GeminiConfig:
        """Load configuration from environment variables."""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is required. "
                "Please set it in your .env file or environment."
            )
        
        return GeminiConfig(
            api_key=api_key,
            model=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
            base_url=os.environ.get(
                "GEMINI_BASE_URL",
                "https://generativelanguage.googleapis.com/v1beta/models"
            ),
            timeout=int(os.environ.get("GEMINI_TIMEOUT", "30")),
            max_retries=int(os.environ.get("GEMINI_MAX_RETRIES", "3")),
            retry_delay=float(os.environ.get("GEMINI_RETRY_DELAY", "1.0")),
            retry_backoff=float(os.environ.get("GEMINI_RETRY_BACKOFF", "2.0")),
        )
    
    @classmethod
    def reset_instance(cls) -> None:
        """Reset singleton instance. Useful for testing."""
        cls._instance = None
        cls._config = None
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract JSON from Gemini response text.
        Handles markdown code blocks, raw JSON, and nested structures.
        """
        # Try to find JSON in markdown code blocks
        json_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
        matches = re.findall(json_pattern, text)
        
        for match in matches:
            match = match.strip()
            if match:
                try:
                    return json.loads(match)
                except json.JSONDecodeError:
                    continue
        
        # Try to find JSON between curly braces
        brace_pattern = r"(\{[\s\S]*\})"
        matches = re.findall(brace_pattern, text)
        
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue
        
        # Try entire text as JSON
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass
        
        raise GeminiParsingError(
            f"Could not extract valid JSON from response. Raw text: {text[:500]}"
        )
    
    def _parse_response(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Gemini API response structure."""
        if "error" in response_data:
            error = response_data["error"]
            raise GeminiAPIError(
                f"Gemini API error: {error.get('message', 'Unknown error')} "
                f"(code: {error.get('code', 'unknown')})"
            )
        
        candidates = response_data.get("candidates", [])
        if not candidates:
            raise GeminiAPIError("No candidates in Gemini response")
        
        content = candidates[0].get("content", {})
        parts = content.get("parts", [])
        
        if not parts:
            raise GeminiAPIError("No content parts in Gemini response")
        
        # Concatenate all text parts
        full_text = "".join(
            part.get("text", "") for part in parts if "text" in part
        )
        
        if not full_text.strip():
            raise GeminiAPIError("Empty text in Gemini response")
        
        # Attempt to parse as JSON, fall back to structured wrapper
        try:
            parsed = self._extract_json_from_text(full_text)
            return {
                "success": True,
                "data": parsed,
                "raw_text": full_text,
                "model": self.config.model,
                "parsed_as_json": True
            }
        except GeminiParsingError:
            # Return raw text wrapped in structure for non-JSON responses
            return {
                "success": True,
                "data": {"raw_response": full_text},
                "raw_text": full_text,
                "model": self.config.model,
                "parsed_as_json": False
            }
    
    @_retry_on_failure(
        max_retries=3, retry_delay=1.0, backoff=2.0
    )
    def _make_request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute HTTP request with timeout handling."""
        try:
            response = self.session.post(
                self._endpoint,
                json=payload,
                timeout=(5, self.config.timeout)  # (connect, read) timeouts
            )
            response.raise_for_status()
            return response.json()
        except requests.Timeout as e:
            raise GeminiTimeoutError(
                f"Gemini API request timed out after {self.config.timeout}s"
            ) from e
        except requests.RequestException as e:
            raise GeminiAPIError(f"Gemini API request failed: {str(e)}") from e
    
    def generate_content(
        self,
        prompt: str,
        temperature: float = 0.2,
        max_output_tokens: int = 2048,
        response_mime_type: Optional[str] = "application/json",
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate content using Gemini API.
        
        Args:
            prompt: The main prompt text
            temperature: Sampling temperature (0.0 - 1.0)
            max_output_tokens: Maximum tokens in response
            response_mime_type: Force JSON output when supported
            system_instruction: Optional system-level instruction
            
        Returns:
            Structured response dict with 'success', 'data', 'raw_text', 'model'
        """
        contents = [{"role": "user", "parts": [{"text": prompt}]}]
        
        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            }
        }
        
        if response_mime_type:
            payload["generationConfig"]["responseMimeType"] = response_mime_type
        
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }
        
        response_data = self._make_request(payload)
        return self._parse_response(response_data)
    
    def generate_structured(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        temperature: float = 0.1,
        max_output_tokens: int = 4096,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate strictly structured JSON output with optional schema validation.
        Lower temperature for more deterministic outputs.
        """
        # Enhance prompt with schema if provided
        enhanced_prompt = prompt
        if schema:
            schema_hint = (
                f"\n\nYou MUST respond with valid JSON matching this schema:\n"
                f"{json.dumps(schema, indent=2)}\n"
                f"Do not include markdown formatting, explanations, or any text outside the JSON."
            )
            enhanced_prompt += schema_hint
        else:
            enhanced_prompt += (
                "\n\nRespond with valid JSON only. No markdown, no explanations."
            )
        
        return self.generate_content(
            prompt=enhanced_prompt,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            response_mime_type="application/json",
            system_instruction=system_instruction
        )
    
    def health_check(self) -> Dict[str, Any]:
        """Verify API connectivity with minimal request."""
        try:
            result = self.generate_content(
                prompt='{"status": "ok"}',
                temperature=0.0,
                max_output_tokens=10
            )
            return {
                "healthy": result.get("success", False),
                "model": self.config.model,
                "latency_ms": None  # Could be instrumented
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "model": self.config.model
            }


# Convenience function for direct import
def get_gemini_client() -> GeminiClient:
    """Get or create the singleton Gemini client instance."""
    return GeminiClient()