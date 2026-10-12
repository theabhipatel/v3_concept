"""ABI (Abhi's Brain Interface) agent API.

Deployed as its own Vercel project. The web app reaches it through the /api/agent/* rewrite,
so every route lives under that prefix.
"""

from fastapi import APIRouter, FastAPI

app = FastAPI(title="ABI (Abhi's Brain Interface)", version="0.1.0")
router = APIRouter(prefix="/api/agent")


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "agent": "ABI (Abhi's Brain Interface)"}


app.include_router(router)
