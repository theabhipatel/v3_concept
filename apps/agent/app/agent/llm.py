"""Which model answers: Groq's free tier (everyone), or a signed-in power user's own OpenAI key.

The website decrypts the user's key and forwards it with the request (behind a shared secret);
the agent keeps it only in this request's context, never in logs or the database.
"""

import json
import re
from contextvars import ContextVar
from dataclasses import dataclass

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI

from app.config import get_settings


@dataclass(frozen=True)
class Power:
    key: str
    model: str


power: ContextVar[Power | None] = ContextVar("power", default=None)

# Reasoning models spend part of the output budget thinking, so they get extra room.
REASONING = re.compile(r"^(gpt-5|gpt-6|o\d)")


def llm(fast: bool, *, max_tokens: int, temperature: float = 0.2, json_mode: bool = False) -> BaseChatModel:
    """The chat model for this request. fast = the small helper model (rewrite, follow-ups, JD)."""
    p = power.get()
    if p:
        reasoning = bool(REASONING.match(p.model))
        return ChatOpenAI(
            model=p.model,
            api_key=p.key,
            max_retries=2,
            use_responses_api=True,
            store=False,
            max_tokens=max_tokens + (3000 if reasoning else 0),
            **({"reasoning": {"effort": "low"}} if reasoning else {"temperature": temperature}),
        )
    s = get_settings()
    kwargs = {"reasoning_effort": "low"} if fast else {}
    model = ChatGroq(
        model=s.abi_fast_model if fast else s.abi_chat_model, api_key=s.groq_api_key, max_retries=3,
        temperature=temperature, max_tokens=max_tokens, **kwargs,
    )
    return model.bind(response_format={"type": "json_object"}) if json_mode else model


def model_name() -> str:
    p = power.get()
    return p.model if p else get_settings().abi_chat_model


def parse_json(text: str) -> dict:
    """JSON from a model reply, tolerating a code fence or a sentence around it."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise
        return json.loads(match.group(0))
