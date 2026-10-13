"""ABI's LangGraph: rewrite -> retrieve -> agent <-> tools.

Conversation state is checkpointed in Postgres per session (thread_id), so the browser only
sends the newest message.
"""

from dataclasses import asdict
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_groq import ChatGroq
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from app.agent.prompts import REWRITE, SYSTEM, clean, format_context
from app.agent.tools import TOOLS
from app.config import get_settings
from app.db import get_pool
from app.rag.embeddings import embed_query
from app.rag.store import hybrid_search

MAX_TOOL_ROUNDS = 3
TOOL_RESULT_CHARS = 1500  # older tool results are trimmed in history to save tokens


class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    query: str
    hits: list[dict]


def _llm(model: str, **kwargs) -> ChatGroq:
    return ChatGroq(model=model, api_key=get_settings().groq_api_key, max_retries=3, **kwargs)


def _recent(messages: list[AnyMessage]) -> list[AnyMessage]:
    """Last N messages, starting at a visitor message so no tool result loses its tool call."""
    recent = messages[-get_settings().history_messages :]
    while recent and not isinstance(recent[0], HumanMessage):
        recent = recent[1:]
    return [
        ToolMessage(m.content[:TOOL_RESULT_CHARS], tool_call_id=m.tool_call_id, name=m.name)
        if isinstance(m, ToolMessage) and isinstance(m.content, str) and len(m.content) > TOOL_RESULT_CHARS
        else m
        for m in recent
    ]


def _turn_start(messages: list[AnyMessage]) -> int:
    for i in range(len(messages) - 1, -1, -1):
        if isinstance(messages[i], HumanMessage):
            return i
    return 0


async def rewrite(state: State) -> dict:
    question = state["messages"][-1].content
    earlier = [m for m in _recent(state["messages"][:-1]) if isinstance(m, (HumanMessage, AIMessage)) and m.content]
    s = get_settings()
    if not earlier or not s.abi_fast_model:
        return {"query": question}
    history = "\n".join(f"{m.type}: {str(m.content)[:400]}" for m in earlier[-4:])
    res = await _llm(s.abi_fast_model, temperature=0, max_tokens=400, reasoning_effort="low").ainvoke(
        REWRITE.format(history=history, question=question)
    )
    return {"query": str(res.content).strip() or question}


async def retrieve(state: State) -> dict:
    hits = await hybrid_search(state["query"], await embed_query(state["query"]), top_k=6)
    return {"hits": [asdict(h) for h in hits]}


async def agent(state: State) -> dict:
    s = get_settings()
    rounds = sum(
        1 for m in state["messages"][_turn_start(state["messages"]) :] if isinstance(m, AIMessage) and m.tool_calls
    )
    llm = _llm(s.abi_chat_model, temperature=0.2, max_tokens=900)
    if rounds < MAX_TOOL_ROUNDS:
        llm = llm.bind_tools(TOOLS)
    system = SystemMessage(SYSTEM.format(context=format_context(state["hits"])))
    res = await llm.ainvoke([system, *_recent(state["messages"])])
    res.content = clean(str(res.content))
    return {"messages": [res]}


def _route(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if isinstance(last, AIMessage) and last.tool_calls else END


_graph = None


async def get_graph():
    global _graph
    if _graph is None:
        builder = StateGraph(State)
        builder.add_node("rewrite", rewrite)
        builder.add_node("retrieve", retrieve)
        builder.add_node("agent", agent)
        builder.add_node("tools", ToolNode(TOOLS, handle_tool_errors=True))
        builder.add_edge(START, "rewrite")
        builder.add_edge("rewrite", "retrieve")
        builder.add_edge("retrieve", "agent")
        builder.add_conditional_edges("agent", _route, ["tools", END])
        builder.add_edge("tools", "agent")
        _graph = builder.compile(checkpointer=AsyncPostgresSaver(await get_pool()))
    return _graph


async def setup_checkpointer() -> None:
    await AsyncPostgresSaver(await get_pool()).setup()


def user_turn(text: str) -> dict:
    return {"messages": [HumanMessage(text)]}
