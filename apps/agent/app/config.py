"""Settings from environment variables (.env locally, Vercel env in production)."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

AGENT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=AGENT_ROOT / ".env", extra="ignore")

    # Groq (free tier). Model IDs live here, never in code.
    groq_api_key: str = ""
    abi_chat_model: str = ""
    abi_fast_model: str = ""  # small model: query rewrite, follow-ups, JD match, resume
    abi_stt_model: str = "whisper-large-v3-turbo"
    # Groq text-to-speech (free tier is small: about 100 requests a day, 200 characters each).
    # When it fails or runs out, the browser falls back to its own free speech.
    abi_tts_model: str = "canopylabs/orpheus-v1-english"
    abi_tts_voice: str = "troy"
    abi_guard_model: str = "meta-llama/llama-prompt-guard-2-86m"
    abi_guard_threshold: float = 0.9

    # Gemini embeddings (free tier)
    gemini_api_key: str = ""
    abi_embed_model: str = "gemini-embedding-001"
    abi_embed_dim: int = 768

    # Shared with the website: lets it forward a signed-in power user's own OpenAI key.
    # Empty turns power mode off.
    abi_power_secret: str = ""

    database_url: str = ""
    github_token: str = ""  # optional, raises the GitHub API limit during ingestion

    content_dir: Path = AGENT_ROOT.parent.parent / "content"
    site_url: str = "https://www.theabhipatel.com"
    booking_url: str = ""  # scheduling link (e.g. Cal.com); empty = contact form

    # Basic abuse limits (section 11)
    max_message_chars: int = 6000  # room for a pasted job description
    rate_limit_per_window: int = 30
    rate_limit_window_seconds: int = 600
    history_messages: int = 8
    max_audio_bytes: int = 4_000_000


@lru_cache
def get_settings() -> Settings:
    return Settings()
