"""ABI (Abhi's Brain Interface) agent API.

Deployed as its own Vercel project. The web app reaches it through the /api/agent/* rewrite,
so every route lives under that prefix. /chat streams the Vercel AI SDK UI message stream
protocol (SSE), so the browser can use useChat directly.
"""

import hmac
import json
import logging
import re
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
import openai
from fastapi import APIRouter, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import Response, StreamingResponse
from groq import APIStatusError, RateLimitError
from langchain_core.messages import AIMessage, ToolMessage
from langgraph.errors import GraphRecursionError
from pydantic import BaseModel, Field

from app.agent.graph import get_graph, user_turn
from app.agent.llm import Power, llm, model_name, parse_json, power
from app.agent.prompts import FOLLOWUPS, clean
from app.config import get_settings
from app.db import close_pool
from app.rag.embeddings import embed_query
from app.rag.store import hit_rate_limit, hybrid_search

BUSY = (
    "I'm getting a lot of questions right now and need a short break. Please try again in a "
    "minute, or reach Abhishek directly through the [contact form](/contact)."
)
BLOCKED = (
    "That message looks like an attempt to change how I work, so I'll skip it. I'm happy to "
    "answer anything about Abhishek's work, skills or projects!"
)
POWER_FAILED = (
    "OpenAI did not accept that request. Your key may be out of credit, or the model is not "
    "available to it. Check your key and models in [ABI settings](/settings)."
)
SESSION_RE = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
logger = logging.getLogger("abi")


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    await close_pool()


app = FastAPI(title="ABI (Abhi's Brain Interface)", version="0.3.0", lifespan=lifespan)
router = APIRouter(prefix="/api/agent")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "agent": "ABI (Abhi's Brain Interface)"}


def _sse(part: dict) -> str:
    return f"data: {json.dumps(part)}\n\n"


def _parse_body(body: dict) -> tuple[str, str]:
    """Accept {sessionId, message} or the AI SDK useChat shape {id, messages: [...]}."""
    session = body.get("sessionId") or body.get("id") or ""
    message = body.get("message")
    if message is None and body.get("messages"):
        last = body["messages"][-1]
        message = "".join(p.get("text", "") for p in last.get("parts", []) if p.get("type") == "text")
    return str(session), str(message or "").strip()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")


async def _limit(request: Request, bucket: str) -> None:
    if await hit_rate_limit(f"{bucket}:{_client_ip(request)}"):
        raise HTTPException(429, "Too many requests. Please wait a few minutes.")


async def _guard_score(text: str) -> float:
    """Prompt-injection score from Llama Prompt Guard (0 safe, 1 attack). Fails open."""
    s = get_settings()
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {s.groq_api_key}"},
                json={"model": s.abi_guard_model, "messages": [{"role": "user", "content": text[:2000]}]},
            )
            return float(res.json()["choices"][0]["message"]["content"])
    except Exception:
        return 0.0


async def _followups(question: str, answer: str) -> list[str]:
    try:
        model = llm(True, temperature=0.5, max_tokens=500, json_mode=True)
        res = await model.ainvoke(FOLLOWUPS.format(question=question[:500], answer=answer[:1200]))
        return [clean(q) for q in parse_json(res.text).get("questions", [])][:3]
    except Exception:
        return []


def _power(request: Request) -> Power | None:
    """A signed-in power user's OpenAI key, forwarded by the website behind the shared secret."""
    secret = get_settings().abi_power_secret
    sent = request.headers.get("x-abi-power", "")
    key = request.headers.get("x-abi-openai-key", "")
    model = request.headers.get("x-abi-model", "")
    if not (secret and sent and key and model):
        return None
    if not hmac.compare_digest(sent.encode(), secret.encode()):
        raise HTTPException(401, "Bad power secret")
    if not re.fullmatch(r"[A-Za-z0-9._:-]{1,80}", model):
        raise HTTPException(400, "Invalid model")
    return Power(key=key, model=model)


async def _stream(session: str, message: str, owner: Power | None = None) -> AsyncIterator[str]:
    started = time.monotonic()
    s = get_settings()
    power.set(owner)  # this request's model (the context is copied into every graph step)
    text_id = "text-1"
    trace: dict = {"model": model_name(), "query": message, "tools": [], "sources": 0}
    hits: list[dict] = []
    tool_args: dict[str, dict] = {}
    answer, pending, ok = "", "", True

    yield _sse({"type": "start", "messageId": uuid.uuid4().hex})
    yield _sse({"type": "text-start", "id": text_id})

    # Power users are signed in and pay for their own key, so their messages skip the guard.
    score = 0.0 if owner else await _guard_score(message)
    if not owner:
        trace["guard"] = round(score, 3)
    if score >= s.abi_guard_threshold:
        answer, ok = BLOCKED, False
        yield _sse({"type": "text-delta", "id": text_id, "delta": BLOCKED})
    else:
        graph = await get_graph()
        config = {"configurable": {"thread_id": session}, "recursion_limit": 12}
        try:
            async for mode, payload in graph.astream(user_turn(message), config, stream_mode=["updates", "messages"]):
                if mode == "updates":
                    if "rewrite" in payload:
                        trace["query"] = payload["rewrite"]["query"]
                    elif "retrieve" in payload:
                        hits = payload["retrieve"]["hits"]
                        trace["sources"] = len(hits)
                        yield _sse(
                            {
                                "type": "data-retrieval",
                                "data": {
                                    "query": trace["query"],
                                    "sources": [
                                        {"n": i, "title": h["title"], "url": h["url"], "kind": h["kind"]}
                                        for i, h in enumerate(hits, start=1)
                                    ],
                                },
                            }
                        )
                    elif "agent" in payload:
                        for m in payload["agent"]["messages"]:
                            if isinstance(m, AIMessage):
                                for call in m.tool_calls:
                                    tool_args[call["id"]] = call["args"]
                    elif "tools" in payload:
                        for m in payload["tools"]["messages"]:
                            if not isinstance(m, ToolMessage):
                                continue
                            trace["tools"].append(m.name)
                            try:
                                output = json.loads(m.content) if isinstance(m.content, str) else {}
                            except json.JSONDecodeError:
                                output = {"error": str(m.content)[:200]}
                            yield _sse(
                                {
                                    "type": "data-ui",
                                    "id": m.tool_call_id,
                                    "data": {"tool": m.name, "input": tool_args.get(m.tool_call_id, {}), "output": output},
                                }
                            )
                        if answer and not answer.endswith("\n"):
                            pending += "\n\n"
                elif mode == "messages":
                    chunk, meta = payload
                    text = chunk.text if meta.get("langgraph_node") == "agent" else ""
                    if text:
                        # Hold back a possibly unfinished citation like "[3†L2" until it closes.
                        pending += text
                        if pending.rfind("[") > pending.rfind("]") and len(pending) < 40:
                            continue
                        delta, pending = clean(pending), ""
                        if answer.endswith(" ") and delta.startswith(" "):
                            delta = delta.lstrip(" ")  # "GCM " + " - the" -> "GCM - the"
                        answer += delta
                        yield _sse({"type": "text-delta", "id": text_id, "delta": delta})
            if pending.strip():
                answer += clean(pending)
                yield _sse({"type": "text-delta", "id": text_id, "delta": clean(pending)})
        except (RateLimitError, APIStatusError) as e:
            logger.warning("groq error: %s", e)
            answer, ok = answer + BUSY, False
            yield _sse({"type": "text-delta", "id": text_id, "delta": BUSY})
        except openai.APIError as e:
            logger.warning("openai error: %s", type(e).__name__)  # never log the request (it holds the key)
            answer, ok = answer + POWER_FAILED, False
            yield _sse({"type": "text-delta", "id": text_id, "delta": POWER_FAILED})
        except GraphRecursionError:
            pass
        except Exception:
            # The site must keep working when AI is down: degrade to a friendly message.
            logger.exception("chat stream failed")
            answer, ok = answer + BUSY, False
            yield _sse({"type": "text-delta", "id": text_id, "delta": BUSY})
    yield _sse({"type": "text-end", "id": text_id})

    # Cited sources become source parts (links + "How I answered").
    for n in sorted({int(x) for x in re.findall(r"\[(\d+)\]", answer)}):
        if 1 <= n <= len(hits):
            h = hits[n - 1]
            yield _sse({"type": "source-url", "sourceId": str(n), "url": f"{s.site_url}{h['url']}", "title": h["title"]})

    if ok and answer:
        if questions := await _followups(message, answer):
            yield _sse({"type": "data-suggestions", "data": {"questions": questions}})
    trace["ms"] = int((time.monotonic() - started) * 1000)
    yield _sse({"type": "data-trace", "data": trace})
    yield _sse({"type": "finish"})
    yield "data: [DONE]\n\n"


@router.post("/chat")
async def chat(request: Request) -> StreamingResponse:
    s = get_settings()
    session, message = _parse_body(await request.json())
    if not SESSION_RE.match(session):
        raise HTTPException(400, "Invalid session id")
    if not message:
        raise HTTPException(400, "Empty message")
    if len(message) > s.max_message_chars:
        raise HTTPException(413, f"Message too long (max {s.max_message_chars} characters)")
    owner = _power(request)
    if not owner:
        await _limit(request, "chat")
    return StreamingResponse(
        _stream(session, message, owner),
        media_type="text/event-stream",
        headers={"x-vercel-ai-ui-message-stream": "v1", "Cache-Control": "no-cache"},
    )


@router.post("/transcribe")
async def transcribe(request: Request, audio: UploadFile = File(...)) -> dict:
    """Push-to-talk speech-to-text (Groq Whisper). Audio is never stored."""
    s = get_settings()
    await _limit(request, "voice")
    data = await audio.read()
    if not data or len(data) > s.max_audio_bytes:
        raise HTTPException(413, "Recording is empty or too long")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {s.groq_api_key}"},
                data={"model": s.abi_stt_model, "response_format": "json", "language": "en"},
                files={"file": (audio.filename or "speech.webm", data, audio.content_type or "audio/webm")},
            )
        res.raise_for_status()
    except httpx.HTTPError as e:
        logger.warning("transcribe failed: %s", e)
        raise HTTPException(503, "Voice is resting right now. Please type your question.") from e
    return {"text": clean(res.json().get("text", "").strip())}


# When Groq speech fails (terms not accepted, daily limit reached), skip it for a while so the
# browser falls back to its own voice immediately instead of waiting on a doomed request.
_tts_off_until = 0.0
TTS_COOLDOWN_S = 600


@router.get("/speak")
async def speak(request: Request, text: str = "") -> Response:
    """ABI's voice: Groq Orpheus text-to-speech, one sentence group (max 200 characters) per call.

    Identical phrases are cached by the CDN for a month, which saves the small free quota. Any
    failure returns 503 quickly and the browser speaks with its own free voice instead.
    """
    global _tts_off_until
    s = get_settings()
    text = " ".join(text.split())
    if not 1 <= len(text) <= 200:
        raise HTTPException(422, "Text must be 1 to 200 characters")
    no_store = {"Cache-Control": "no-store"}
    if time.time() < _tts_off_until:
        return Response(status_code=503, headers=no_store)
    await _limit(request, "speak")  # own bucket: one spoken answer is several parts
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/audio/speech",
                headers={"Authorization": f"Bearer {s.groq_api_key}"},
                json={"model": s.abi_tts_model, "voice": s.abi_tts_voice, "input": text, "response_format": "wav"},
            )
    except httpx.HTTPError as e:
        logger.warning("speak failed: %s", e)
        return Response(status_code=503, headers=no_store)
    if res.status_code != 200:
        # Terms not accepted, daily/minute limit, or an outage: let the browser voice take over.
        if res.status_code in (400, 401, 403, 429) or res.status_code >= 500:
            # The daily quota refills gradually, so a rate limit only waits as long as Groq asks.
            try:
                wait = min(TTS_COOLDOWN_S, max(15.0, float(res.headers.get("retry-after", ""))))
            except ValueError:
                wait = TTS_COOLDOWN_S
            _tts_off_until = time.time() + wait
        logger.warning("speak failed: %s %s", res.status_code, res.text[:200])
        return Response(status_code=503, headers=no_store)
    return Response(
        content=res.content,
        media_type="audio/wav",
        headers={"Cache-Control": "public, max-age=86400, s-maxage=2592000"},
    )


class SearchBody(BaseModel):
    query: str = Field(min_length=2, max_length=300)


@router.post("/search")
async def search(request: Request, body: SearchBody) -> dict:
    """Lab demo: show what hybrid retrieval finds for a query, with fused scores."""
    await _limit(request, "lab")
    hits = await hybrid_search(body.query, await embed_query(body.query), top_k=6)
    return {"hits": [{"title": h.title, "url": h.url, "kind": h.kind, "score": round(h.score, 4), "snippet": h.content[:220]} for h in hits]}


class GuardBody(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@router.post("/guard")
async def guard(request: Request, body: GuardBody) -> dict:
    """Lab demo: prompt-injection score for a message."""
    await _limit(request, "lab")
    score = await _guard_score(body.text)
    return {"score": round(score, 4), "blocked": score >= get_settings().abi_guard_threshold}


app.include_router(router)
