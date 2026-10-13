"""Answer-accuracy evals for ABI. Run: uv run python -m evals.run

Each case checks required/forbidden phrases, that sources are cited, and optionally that the
expected page was retrieved. Uses the free Groq quota, so keep the set small.
"""

import asyncio
import json
import re
import uuid
from pathlib import Path

from app.agent.graph import get_graph, user_turn
from app.db import close_pool

CASES = Path(__file__).with_name("cases.json")


async def main() -> None:
    graph = await get_graph()
    cases = json.loads(CASES.read_text())
    passed = 0
    for case in cases:
        config = {"configurable": {"thread_id": f"eval-{uuid.uuid4().hex}"}}
        state = await graph.ainvoke(user_turn(case["question"]), config)
        answer = str(state["messages"][-1].content)
        low = answer.lower()
        urls = [h["url"] for h in state["hits"]]
        problems = [f"missing '{p}'" for p in case.get("must_include", []) if p.lower() not in low]
        problems += [f"contains '{p}'" for p in case.get("must_exclude", []) if p.lower() in low]
        if case.get("cite", True) and not re.search(r"\[\d+\]", answer):
            problems.append("no citation")
        if case.get("url") and case["url"] not in urls:
            problems.append(f"{case['url']} not retrieved")
        passed += not problems
        print(f"{'PASS' if not problems else 'FAIL'}  {case['question']}")
        if problems:
            print(f"      {'; '.join(problems)}\n      answer: {answer[:300]}")
    print(f"\n{passed}/{len(cases)} passed")
    await close_pool()


if __name__ == "__main__":
    asyncio.run(main())
