"""pgvector store with hybrid retrieval: vector + keyword search, fused (RRF), then reranked."""

import re
from dataclasses import dataclass

from app.config import get_settings
from app.db import get_pool
from app.rag.documents import Chunk

RRF_K = 60
CANDIDATES = 20
MAX_PER_KIND = {"skills": 3}  # skill lists all mention years, so they flood generic questions


@dataclass
class Hit:
    id: str
    kind: str
    title: str
    url: str
    content: str
    score: float


def _vec(v: list[float]) -> str:
    return "[" + ",".join(f"{x:.7f}" for x in v) + "]"


async def ensure_schema() -> None:
    dim = get_settings().abi_embed_dim
    pool = await get_pool()
    async with pool.connection() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        await conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS abi_chunks (
                id text PRIMARY KEY,
                kind text NOT NULL,
                title text NOT NULL,
                url text NOT NULL,
                content text NOT NULL,
                hash text NOT NULL,
                embedding vector({dim}) NOT NULL,
                tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || content)) STORED,
                updated_at timestamptz NOT NULL DEFAULT now()
            )"""
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS abi_chunks_embedding_idx ON abi_chunks USING hnsw (embedding vector_cosine_ops)"
        )
        await conn.execute("CREATE INDEX IF NOT EXISTS abi_chunks_tsv_idx ON abi_chunks USING gin (tsv)")
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS abi_rate_limits (
                key text PRIMARY KEY,
                window_start timestamptz NOT NULL,
                count int NOT NULL
            )"""
        )


async def existing_hashes() -> dict[str, str]:
    pool = await get_pool()
    async with pool.connection() as conn:
        rows = await (await conn.execute("SELECT id, hash FROM abi_chunks")).fetchall()
    return {r["id"]: r["hash"] for r in rows}


async def upsert(chunks: list[Chunk], embeddings: list[list[float]]) -> None:
    pool = await get_pool()
    async with pool.connection() as conn:
        for c, e in zip(chunks, embeddings, strict=True):
            await conn.execute(
                """
                INSERT INTO abi_chunks (id, kind, title, url, content, hash, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
                ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, title = EXCLUDED.title,
                    url = EXCLUDED.url, content = EXCLUDED.content, hash = EXCLUDED.hash,
                    embedding = EXCLUDED.embedding, updated_at = now()""",
                (c.id, c.kind, c.title, c.url, c.content, c.hash, _vec(e)),
            )


async def delete_except(keep_ids: set[str]) -> int:
    pool = await get_pool()
    async with pool.connection() as conn:
        cur = await conn.execute("DELETE FROM abi_chunks WHERE NOT (id = ANY(%s))", (list(keep_ids),))
        return cur.rowcount


def _keyword_query(text: str) -> str:
    words = {w for w in re.findall(r"[a-z0-9]+", text.lower()) if len(w) > 1}
    return " | ".join(sorted(words))


def _rerank(query: str, hits: list[Hit], top_k: int) -> list[Hit]:
    """Light rerank on top of RRF: boost chunks whose title is named in the question (so a
    project's README ranks right after its page), keep at most 2 README chunks per project
    and 3 skills chunks, so no single source crowds out the rest."""
    q = query.lower()
    for h in hits:
        title = h.title.lower().removesuffix(" readme")
        if title and title in q:
            h.score += 0.05
    hits.sort(key=lambda h: h.score, reverse=True)
    out, per_readme, per_kind = [], {}, {}
    for h in hits:
        if h.kind == "readme":
            per_readme[h.url] = per_readme.get(h.url, 0) + 1
            if per_readme[h.url] > 2:
                continue
        per_kind[h.kind] = per_kind.get(h.kind, 0) + 1
        if per_kind[h.kind] > MAX_PER_KIND.get(h.kind, top_k):
            continue
        out.append(h)
        if len(out) == top_k:
            break
    return out


async def hybrid_search(query: str, query_embedding: list[float], top_k: int = 8) -> list[Hit]:
    pool = await get_pool()
    async with pool.connection() as conn:
        rows = await (
            await conn.execute(
                """
                WITH v AS (
                    SELECT id, row_number() OVER (ORDER BY embedding <=> %(emb)s::vector) AS r
                    FROM abi_chunks ORDER BY embedding <=> %(emb)s::vector LIMIT %(n)s
                ), k AS (
                    SELECT id, row_number() OVER (ORDER BY ts_rank_cd(tsv, q) DESC) AS r
                    FROM abi_chunks, to_tsquery('english', %(tsq)s) AS q
                    WHERE tsv @@ q ORDER BY ts_rank_cd(tsv, q) DESC LIMIT %(n)s
                ), t AS (
                    -- pages named in the question (e.g. a project title) are always candidates
                    SELECT id FROM abi_chunks
                    WHERE kind <> 'readme' AND length(title) > 2 AND %(q)s ILIKE '%%' || title || '%%'
                )
                SELECT c.id, c.kind, c.title, c.url, c.content,
                       COALESCE(1.0 / (%(rrf)s + v.r), 0) + COALESCE(1.0 / (%(rrf)s + k.r), 0)
                       + CASE WHEN t.id IS NOT NULL THEN 1.0 / (%(rrf)s + 1) ELSE 0 END AS score
                FROM abi_chunks c
                LEFT JOIN v ON v.id = c.id
                LEFT JOIN k ON k.id = c.id
                LEFT JOIN t ON t.id = c.id
                WHERE v.id IS NOT NULL OR k.id IS NOT NULL OR t.id IS NOT NULL
                ORDER BY score DESC LIMIT %(n)s""",
                {"emb": _vec(query_embedding), "tsq": _keyword_query(query), "q": query, "n": CANDIDATES, "rrf": RRF_K},
            )
        ).fetchall()
    hits = [Hit(r["id"], r["kind"], r["title"], r["url"], r["content"], float(r["score"])) for r in rows]
    return _rerank(query, hits, top_k)


async def hit_rate_limit(key: str) -> bool:
    """Fixed-window counter in Postgres (works across serverless instances)."""
    s = get_settings()
    pool = await get_pool()
    async with pool.connection() as conn:
        row = await (
            await conn.execute(
                """
                INSERT INTO abi_rate_limits AS r (key, window_start, count) VALUES (%(k)s, now(), 1)
                ON CONFLICT (key) DO UPDATE SET
                    count = CASE WHEN r.window_start < now() - make_interval(secs => %(w)s) THEN 1 ELSE r.count + 1 END,
                    window_start = CASE WHEN r.window_start < now() - make_interval(secs => %(w)s) THEN now() ELSE r.window_start END
                RETURNING count""",
                {"k": key, "w": s.rate_limit_window_seconds},
            )
        ).fetchone()
    return row["count"] > s.rate_limit_per_window
