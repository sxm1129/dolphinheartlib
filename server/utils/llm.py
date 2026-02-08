import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any

from server.config import OPENROUTER_API_KEY, OPENROUTER_MODEL_NAME, GEMINI_API_KEY


class LLMClient:
    """Base class for LLM clients."""
    def generate(self, prompt: str) -> str:
        raise NotImplementedError


class OpenRouterClient(LLMClient):
    """Client for OpenRouter API."""
    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        self.model = OPENROUTER_MODEL_NAME or "google/gemini-2.0-flash-exp"
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"

    def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("OpenRouter API Key not set")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/dolphpinheartlib", # Placeholder
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2048,
        }
        
        req = urllib.request.Request(
            self.api_url,
            data=json.dumps(data).encode('utf-8'),
            headers=headers,
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result['choices'][0]['message']['content'].strip()
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            raise RuntimeError(f"OpenRouter API Error {e.code}: {error_body}")
        except Exception as e:
            raise RuntimeError(f"OpenRouter Request Failed: {str(e)}")


class GeminiClient(LLMClient):
    """Client for Google Gemini API (via REST)."""
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model = "gemini-1.5-flash" # Use a stable model
        # Using v1beta API
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

    def generate(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("Gemini API Key not set")

        headers = {
            "Content-Type": "application/json",
        }
        
        data = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        req = urllib.request.Request(
            self.api_url,
            data=json.dumps(data).encode('utf-8'),
            headers=headers,
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                # Extract text from Gemini response structure
                try:
                    return result['candidates'][0]['content']['parts'][0]['text'].strip()
                except (KeyError, IndexError):
                    if 'promptFeedback' in result:
                        raise RuntimeError(f"Gemini Safety Filter Triggered: {result['promptFeedback']}")
                    raise RuntimeError("Empty response from Gemini")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            raise RuntimeError(f"Gemini API Error {e.code}: {error_body}")
        except Exception as e:
            raise RuntimeError(f"Gemini Request Failed: {str(e)}")


def get_llm_client() -> LLMClient:
    """Factory to get the appropriate LLM client based on configuration."""
    if OPENROUTER_API_KEY:
        return OpenRouterClient()
    elif GEMINI_API_KEY:
        return GeminiClient()
    else:
        raise ValueError("No LLM API Key configured (OpenRouter or Gemini)")
