"""One shared async Postgres pool (pgvector chunks, rate limits, LangGraph checkpoints)."""

from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from app.config import get_settings

_pool: AsyncConnectionPool | None = None


async def get_pool() -> AsyncConnectionPool:
    global _pool
    if _pool is None:
        _pool = AsyncConnectionPool(
            get_settings().database_url,
            min_size=1,
            max_size=5,
            open=False,
            # autocommit + dict rows are required by the LangGraph Postgres checkpointer;
            # prepare_threshold=0 keeps it working behind Neon/Supabase poolers.
            kwargs={"autocommit": True, "prepare_threshold": 0, "row_factory": dict_row},
        )
        await _pool.open()
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
