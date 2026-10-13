"""Turn content/*.json and public GitHub READMEs into small, citable chunks.

Every chunk carries the page URL it came from, so ABI can link to the exact page or section.
"""

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path

import httpx

README_CHUNK_CHARS = 1200


@dataclass
class Chunk:
    id: str
    kind: str  # profile | experience | project | skills | contact | readme
    title: str
    url: str
    content: str

    @property
    def hash(self) -> str:
        return hashlib.sha256(f"{self.title}\n{self.url}\n{self.content}".encode()).hexdigest()


def _load(content_dir: Path, name: str):
    return json.loads((content_dir / f"{name}.json").read_text())


def _profile_chunks(p: dict) -> list[Chunk]:
    loc = p["location"]
    years = next(s["value"] for s in p["stats"] if s["key"] == "yearsExperience")
    stats = ", ".join(f"{s['value']} {s['label'].lower()}" for s in p["stats"])
    edu = "; ".join(f"{e['degree']}, {e['institution']} ({e['year']})" for e in p["education"])
    socials = "; ".join(f"{s['name']}: {s['url']}" for s in p["socials"])
    services = "\n".join(
        f"- {s['title']}: {s['description']} ({', '.join(s['features'])})" for s in p["services"]
    )
    return [
        Chunk(
            "profile:overview",
            "profile",
            f"About {p['name']}",
            "/about",
            f"{p['name']} ({p['brand']}) is a {p['title']} based in {loc['city']}, "
            f"{loc['region']}, {loc['country']}. Currently works at {p['currentCompany']}. "
            f"{p['bio']}\nTotal professional experience: {years} years. Stats: {stats}.",
        ),
        Chunk("profile:story", "profile", f"{p['name']}'s story", "/about#story", "\n".join(p["longBio"])),
        Chunk("profile:education", "profile", "Education", "/about#education", f"Education: {edu}."),
        Chunk(
            "profile:values",
            "profile",
            "Values and interests",
            "/about#values",
            "Values: "
            + "; ".join(f"{v['title']} - {v['description']}" for v in p["values"])
            + "\nInterests: "
            + "; ".join(f"{i['name']} - {i['description']}" for i in p["interests"]),
        ),
        Chunk("profile:services", "profile", "Services", "/about#services", f"Services offered:\n{services}"),
        Chunk(
            "profile:contact",
            "contact",
            "Contact details and social links",
            "/contact",
            f"Email: {p['email']}. Phone: {p['phone']['display']} ({p['phone']['note']}) "
            f"Website: {p['site']}. Social links: {socials}.",
        ),
    ]


def _experience_chunks(items: list[dict], profile: dict) -> list[Chunk]:
    years = next(s["value"] for s in profile["stats"] if s["key"] == "yearsExperience")
    timeline = "\n".join(f"- {e['period']}: {e['role']} at {e['company']}" for e in items)
    summary = Chunk(
        "experience:summary",
        "experience",
        "Career summary and total years of experience",
        "/about#experience",
        f"{profile['name']} has {years} years of total professional experience, starting in "
        f"{items[-1]['period'].split(' - ')[0]}. Career timeline:\n{timeline}",
    )
    return [summary] + [
        Chunk(
            f"experience:{e['slug']}",
            "experience",
            f"{e['role']} at {e['company']}",
            f"/about#experience-{e['slug']}",
            f"{e['role']} at {e['company']} ({e['period']}, {e['location']}"
            f"{', current role' if e['current'] else ''}). {e['description']}\n"
            f"Highlights: {'; '.join(e['highlights'])}.\nTechnologies: {', '.join(e['technologies'])}.",
        )
        for e in items
    ]


def _project_chunks(items: list[dict]) -> list[Chunk]:
    chunks = []
    for p in items:
        links = [f"Live demo: {p['demo']}" if p["demo"] else "", f"Source code: {p['github']}" if p["github"] else ""]
        kind = "Personal/hobby project" if p["type"] == "personal" else "Professional/client project"
        chunks.append(
            Chunk(
                f"project:{p['slug']}",
                "project",
                p["title"],
                f"/projects/{p['slug']}",
                f"Project: {p['title']}. {kind}. Categories: {', '.join(p['categories'])}.\n"
                f"{p['description']}\nTech stack: {', '.join(p['tags'])}.\n"
                + " ".join(x for x in links if x),
            )
        )
    return chunks


def _skill_chunks(data: dict) -> list[Chunk]:
    chunks = []
    for cat in data["categories"]:
        skills = [s for s in data["skills"] if s["category"] == cat["id"]]
        lines = "\n".join(f"- {s['name']}: {s['level']}, {s['experience']}" for s in skills)
        chunks.append(
            Chunk(
                f"skills:{cat['id'].lower()}",
                "skills",
                f"{cat['label']} skills",
                f"/skills#{cat['id'].lower()}",
                f"{cat['label']} skills (name: proficiency, time used):\n{lines}",
            )
        )
    return chunks


def _contact_chunks(c: dict) -> list[Chunk]:
    hours = "; ".join(f"{a['day']}: {a['time']}" for a in c["availability"])
    chunks = [
        Chunk(
            "contact:availability",
            "contact",
            "Availability and response time",
            "/contact",
            f"Open to: {', '.join(c['openTo'])}. Response time: {c['responseTime']}. Hours: {hours}.",
        )
    ]
    for i, f in enumerate(c["faqs"]):
        chunks.append(Chunk(f"contact:faq-{i}", "contact", f["question"], "/contact#faq", f"Q: {f['question']}\nA: {f['answer']}"))
    return chunks


def content_chunks(content_dir: Path) -> list[Chunk]:
    return [
        *_profile_chunks(profile := _load(content_dir, "profile")),
        *_experience_chunks(_load(content_dir, "experience"), profile),
        *_project_chunks(_load(content_dir, "projects")),
        *_skill_chunks(_load(content_dir, "skills")),
        *_contact_chunks(_load(content_dir, "contact")),
    ]


def _split_markdown(text: str, limit: int = README_CHUNK_CHARS) -> list[str]:
    """Split on headings, then pack sections into chunks of about `limit` characters."""
    text = re.sub(r"<[^>]+>", "", text)  # drop inline HTML (badges, images)
    sections = [s.strip() for s in re.split(r"\n(?=#{1,3} )", text) if s.strip()]
    chunks, current = [], ""
    for section in sections:
        if current and len(current) + len(section) > limit:
            chunks.append(current)
            current = ""
        current = f"{current}\n\n{section}".strip()
        while len(current) > limit * 1.5:
            chunks.append(current[:limit])
            current = current[limit:]
    if current:
        chunks.append(current)
    return chunks


def readme_chunks(content_dir: Path, github_token: str = "") -> list[Chunk]:
    """Fetch READMEs of the public repos linked from projects.json."""
    headers = {"Accept": "application/vnd.github.raw+json"}
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"
    chunks = []
    with httpx.Client(timeout=15, headers=headers) as client:
        for p in _load(content_dir, "projects"):
            m = re.match(r"https://github\.com/([^/]+)/([^/]+)", p["github"])
            if not m:
                continue
            res = client.get(f"https://api.github.com/repos/{m[1]}/{m[2]}/readme")
            if res.status_code != 200:
                print(f"  README skipped for {p['slug']}: HTTP {res.status_code}")
                continue
            for i, part in enumerate(_split_markdown(res.text)):
                chunks.append(
                    Chunk(
                        f"readme:{p['slug']}:{i}",
                        "readme",
                        f"{p['title']} README",
                        f"/projects/{p['slug']}",
                        f"From the GitHub README of {p['title']} ({p['github']}):\n{part}",
                    )
                )
    return chunks
