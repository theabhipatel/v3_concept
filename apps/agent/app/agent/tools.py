"""ABI's tools.

UI tools return a small instruction the browser performs (navigate, filter, theme) or renders
(project cards, comparison, skills, timeline). Server tools fetch live data (GitHub) or run a
focused LLM task grounded in the knowledge base (job match, tailored resume).
"""

import json
import re
import time
from typing import Literal

import httpx
from langchain_core.tools import tool
from langchain_groq import ChatGroq

from app.agent.prompts import format_context
from app.config import get_settings
from app.rag.embeddings import embed_query
from app.rag.store import hybrid_search

GITHUB_USER = "theabhipatel"
ALLOWED_OWNERS = {"theabhipatel", "codingwithcod"}
PAGES = ["/", "/skills", "/projects", "/about", "/contact", "/abi", "/lab"]
PROJECT_CATEGORIES = Literal["all", "AI", "Full Stack", "DevOps", "Frontend", "React Native"]
SKILL_CATEGORIES = Literal["all", "AI", "Frontend", "Backend", "Languages", "Database", "DevOps", "Cloud", "Tools", "Testing"]
_cache: dict[str, tuple[float, dict]] = {}


def _ui(kind: str, **data) -> str:
    return json.dumps({"ui": kind, **data})


# ---------- UI tools (performed or rendered by the browser) ----------


@tool
def go_to(path: str, section: str = "") -> str:
    """Navigate the visitor to a page, optionally scrolling to and highlighting a section.
    path: one of /, /skills, /projects, /about, /contact, /abi, /lab, or /projects/<slug>.
    section (optional): home: prompt|retrieve|reason|act|deliver; about: story|experience|education|values|services;
    contact: form|faq; skills: a category id like ai or devops."""
    if path not in PAGES and not re.fullmatch(r"/projects/[a-z0-9-]+", path):
        return json.dumps({"error": f"Unknown page {path}"})
    return _ui("navigate", path=path, section=re.sub(r"[^a-z0-9-]", "", section.lower()))


@tool
def filter_projects(category: PROJECT_CATEGORIES = "all", type: Literal["all", "personal", "client"] = "all") -> str:
    """Open the projects page filtered by category and/or type (personal hobby vs client work)."""
    return _ui("filter-projects", category=category, type=type)


@tool
def filter_skills(category: SKILL_CATEGORIES = "all") -> str:
    """Open the skills page filtered to one category."""
    return _ui("filter-skills", category=category)


@tool
def set_theme(theme: Literal["light", "dark"]) -> str:
    """Switch the website between light and dark theme."""
    return _ui("theme", theme=theme)


@tool
def show_projects(slugs: list[str]) -> str:
    """Show project cards inside the chat. slugs come from project page URLs, e.g. secure-vault."""
    return _ui("projects", slugs=slugs[:6])


@tool
def compare_projects(slugs: list[str]) -> str:
    """Show a side-by-side comparison table of 2 to 4 projects (by slug) inside the chat."""
    return _ui("compare", slugs=slugs[:4])


@tool
def show_skills(category: SKILL_CATEGORIES = "all") -> str:
    """Show a skills chart (proficiency per skill) inside the chat."""
    return _ui("skills", category=category)


@tool
def show_timeline() -> str:
    """Show Abhishek's experience timeline inside the chat."""
    return _ui("timeline")


@tool
def book_call() -> str:
    """Give the visitor a way to book a call or meeting with Abhishek."""
    url = get_settings().booking_url
    return _ui("book", url=url or "/contact", label="Book a call" if url else "Use the contact form")


@tool
def draft_contact_message(message: str, name: str = "", email: str = "") -> str:
    """Prepare a message to Abhishek for the visitor to review. It is NOT sent until the
    visitor checks it and presses Send in the card."""
    return _ui("contact", name=name[:100], email=email[:200], message=message[:3000])


# ---------- Server tools ----------


def _github() -> httpx.Client:
    headers = {"Accept": "application/vnd.github+json"}
    if token := get_settings().github_token:
        headers["Authorization"] = f"Bearer {token}"
    return httpx.Client(timeout=10, headers=headers)


@tool
def github_stats() -> str:
    """Read live GitHub stats for Abhishek (repos, stars, top languages, recent work)."""
    hit = _cache.get("gh")
    if hit and time.time() - hit[0] < 600:
        return json.dumps(hit[1])
    with _github() as gh:
        user = gh.get(f"https://api.github.com/users/{GITHUB_USER}").json()
        repos = gh.get(f"https://api.github.com/users/{GITHUB_USER}/repos?per_page=100&sort=pushed").json()
    if not isinstance(repos, list):
        return json.dumps({"error": "GitHub is not reachable right now"})
    langs: dict[str, int] = {}
    for r in repos:
        if r.get("language"):
            langs[r["language"]] = langs.get(r["language"], 0) + 1
    data = {
        "ui": "github",
        "profile": f"https://github.com/{GITHUB_USER}",
        "publicRepos": user.get("public_repos"),
        "followers": user.get("followers"),
        "stars": sum(r.get("stargazers_count", 0) for r in repos),
        "topLanguages": [k for k, _ in sorted(langs.items(), key=lambda x: -x[1])[:5]],
        "recent": [
            {"name": r["name"], "url": r["html_url"], "description": r.get("description") or "", "pushedAt": r["pushed_at"][:10]}
            for r in repos[:5]
        ],
    }
    _cache["gh"] = (time.time(), data)
    return json.dumps(data)


_SOURCE_EXT = (".ts", ".tsx", ".py", ".js", ".jsx")
_SKIP = re.compile(r"(node_modules|dist/|build/|\.next/|\.d\.ts$|test|spec|config|migrations|__init__)", re.I)
_PREFER = re.compile(r"(crypto|vault|service|controller|agent|graph|hook|api|route|socket|flow|store|model)", re.I)


@tool
def show_code(repo: str, path: str = "") -> str:
    """Show a real code snippet from one of Abhishek's public GitHub repos.
    repo: "owner/name" taken from a project's source code URL, e.g. theabhipatel/vault.
    path (optional): a file path in the repo; if empty, a representative source file is picked."""
    if repo.split("/")[0] not in ALLOWED_OWNERS or repo.count("/") != 1:
        return json.dumps({"error": "Only Abhishek's public repos can be shown"})
    with _github() as gh:
        meta = gh.get(f"https://api.github.com/repos/{repo}")
        if meta.status_code != 200:
            return json.dumps({"error": f"Repo {repo} is not available"})
        branch = meta.json()["default_branch"]
        if not path:
            tree = gh.get(f"https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1").json().get("tree", [])
            files = [
                t for t in tree
                if t["type"] == "blob" and t["path"].endswith(_SOURCE_EXT) and not _SKIP.search(t["path"])
                and 600 < t.get("size", 0) < 15000
            ]
            if not files:
                return json.dumps({"error": "No suitable source file found"})
            files.sort(key=lambda t: (not _PREFER.search(t["path"]), "src/" not in t["path"], -t["size"]))
            path = files[0]["path"]
        raw = gh.get(f"https://raw.githubusercontent.com/{repo}/{branch}/{path}")
    if raw.status_code != 200:
        return json.dumps({"error": f"Could not read {path}"})
    lines = raw.text.splitlines()
    return json.dumps(
        {
            "ui": "code",
            "repo": repo,
            "path": path,
            "url": f"https://github.com/{repo}/blob/{branch}/{path}",
            "language": path.rsplit(".", 1)[-1],
            "code": "\n".join(lines[:60]),
            "truncated": len(lines) > 60,
        }
    )


async def _grounded_json(task: str, job_description: str) -> dict:
    s = get_settings()
    jd = job_description[:4000]
    hits = await hybrid_search(jd[:1500], await embed_query(jd[:1500]), top_k=10)
    llm = ChatGroq(
        model=s.abi_fast_model, api_key=s.groq_api_key, temperature=0.1, max_tokens=1600,
        max_retries=3, reasoning_effort="low",
    ).bind(response_format={"type": "json_object"})
    prompt = (
        f"{task}\nUse ONLY facts from the CONTEXT about Abhishek Patel. Never invent skills, "
        "projects, numbers or employers. Project slugs are the last part of /projects/<slug> URLs; "
        "experience slugs are the part after /about#experience-. Never use em or en dashes.\n\n"
        f"JOB DESCRIPTION:\n{jd}\n\nCONTEXT:\n{format_context([h.__dict__ for h in hits])}"
    )
    res = await llm.ainvoke(prompt)
    try:
        return json.loads(str(res.content))
    except json.JSONDecodeError:
        return {"error": "Could not analyse that job description"}


@tool
async def match_job_description(job_description: str) -> str:
    """Analyse how well Abhishek fits a pasted job description: fit score, strengths with
    evidence, relevant projects and experience, and honest gaps."""
    data = await _grounded_json(
        'Return JSON: {"score": 0-100, "summary": "2 sentences", "strengths": [{"point": "...", '
        '"evidence": "..."}] (max 5), "projects": [slug] (max 4), "experience": [slug] (max 3), '
        '"gaps": ["..."] (max 3, things the JD asks for that the context does not show)}',
        job_description,
    )
    return json.dumps({"ui": "jd-match", **data})


@tool
async def tailored_resume(job_description: str) -> str:
    """Create a resume for Abhishek tailored to a job description. The visitor can download it as PDF."""
    data = await _grounded_json(
        'Return JSON: {"headline": "role title line", "summary": "3 sentences tailored to the JD", '
        '"skills": ["..."] (8 to 14 most relevant), "experience": [{"slug": "...", "bullets": '
        '["..."] (2 to 4, rephrased from context, most relevant first)}] (all roles, newest first), '
        '"projects": [slug] (3 to 4 most relevant)}',
        job_description,
    )
    return json.dumps({"ui": "resume", **data})


TOOLS = [
    go_to, filter_projects, filter_skills, set_theme, show_projects, compare_projects, show_skills,
    show_timeline, book_call, draft_contact_message, github_stats, show_code, match_job_description,
    tailored_resume,
]
