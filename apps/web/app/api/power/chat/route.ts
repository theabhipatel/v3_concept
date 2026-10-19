import { jsonError, requirePower } from "@/lib/server/power";

const AGENT_URL = process.env.AGENT_URL ?? "http://localhost:8000";

/**
 * ABI's chat for a power user: the same agent, with the user's own OpenAI key and model. The key
 * is decrypted here and forwarded server to server behind the shared secret; the browser never
 * sees it.
 */
export async function POST(request: Request) {
  const { owner, error } = await requirePower();
  if (error) return error;
  const secret = process.env.ABI_POWER_SECRET;
  if (!secret) return jsonError(503, "Power mode is not set up on the server.");
  const upstream = await fetch(`${AGENT_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-abi-power": secret,
      "x-abi-openai-key": owner.key,
      "x-abi-model": owner.settings.mainModel,
      "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
    },
    body: await request.text(),
    signal: request.signal,
  }).catch(() => null);
  if (!upstream?.ok || !upstream.body) return jsonError(upstream?.status ?? 502, "ABI couldn't answer right now.");
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });
}
