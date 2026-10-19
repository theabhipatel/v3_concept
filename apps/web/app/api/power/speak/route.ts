import { TTS_MODEL } from "@/lib/openai-models";
import { jsonError, openaiFetch, requirePower } from "@/lib/server/power";

/** ABI's spoken answers in power mode: OpenAI text-to-speech in the user's chosen voice. */
export async function POST(request: Request) {
  const { owner, error } = await requirePower();
  if (error) return error;
  const { text } = (await request.json().catch(() => ({}))) as { text?: string };
  const input = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!input || input.length > 4000) return jsonError(422, "Text must be 1 to 4000 characters.");
  const res = await openaiFetch(owner.key, "/audio/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: owner.settings.voice,
      input,
      instructions: "Warm, friendly and clear, like a helpful guide. Natural pace.",
      response_format: "mp3",
    }),
  }).catch(() => null);
  if (!res?.ok || !res.body) return jsonError(502, "OpenAI voice is unavailable.");
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
