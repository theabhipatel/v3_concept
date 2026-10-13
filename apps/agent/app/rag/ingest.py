"""Build ABI's knowledge base. Run: uv run python -m app.rag.ingest [--no-readmes]

Only new or changed chunks are embedded, so re-running is cheap on the free tier.
"""

import asyncio
import sys

from app.agent.graph import setup_checkpointer
from app.config import get_settings
from app.db import close_pool
from app.rag import store
from app.rag.documents import content_chunks, readme_chunks
from app.rag.embeddings import embed


async def main(with_readmes: bool) -> None:
    s = get_settings()
    chunks = content_chunks(s.content_dir)
    print(f"content/: {len(chunks)} chunks")
    if with_readmes:
        readmes = readme_chunks(s.content_dir, s.github_token)
        print(f"GitHub READMEs: {len(readmes)} chunks")
        chunks += readmes

    await store.ensure_schema()
    await setup_checkpointer()
    old = await store.existing_hashes()
    changed = [c for c in chunks if old.get(c.id) != c.hash]
    print(f"to embed: {len(changed)} (unchanged: {len(chunks) - len(changed)})")
    for i in range(0, len(changed), 20):  # save progress batch by batch
        batch = changed[i : i + 20]
        vectors = await embed([f"{c.title}\n{c.content}" for c in batch], "RETRIEVAL_DOCUMENT")
        await store.upsert(batch, vectors)
        print(f"  embedded {min(i + 20, len(changed))}/{len(changed)}")
    keep = {c.id for c in chunks}
    if not with_readmes:  # README chunks were not rebuilt this run, so keep them
        keep |= {i for i in old if i.startswith("readme:")}
    removed = await store.delete_except(keep)
    print(f"removed stale: {removed}. Done.")
    await close_pool()


if __name__ == "__main__":
    asyncio.run(main(with_readmes="--no-readmes" not in sys.argv))
