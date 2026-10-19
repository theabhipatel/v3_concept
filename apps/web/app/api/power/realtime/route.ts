import { NextResponse } from "next/server";
import { REALTIME_TOOLS } from "@/lib/realtime-tools";
import { TRANSCRIBE_MODEL } from "@/lib/openai-models";
import { jsonError, openaiFetch, requirePower } from "@/lib/server/power";
import { VOICE_INSTRUCTIONS as INSTRUCTIONS } from "@/lib/server/voice-session";

/**
 * A short-lived key for the browser to open a Realtime voice session with OpenAI over WebRTC.
 * The user's real key stays on the server; this one expires in 10 minutes.
 */
export async function POST() {
  const { owner, error } = await requirePower();
  if (error) return error;
  const res = await openaiFetch(owner.key, "/realtime/client_secrets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 600 },
      session: {
        type: "realtime",
        model: owner.settings.realtimeModel,
        instructions: INSTRUCTIONS,
        audio: {
          input: {
            transcription: { model: TRANSCRIBE_MODEL, language: "en" },
            turn_detection: { type: "semantic_vad", eagerness: "auto" },
            noise_reduction: { type: "near_field" },
          },
          output: { voice: owner.settings.voice },
        },
        tools: REALTIME_TOOLS,
        tool_choice: "auto",
      },
    }),
  }).catch(() => null);
  if (!res?.ok) {
    const detail = res ? ((await res.json().catch(() => ({}))) as { error?: { message?: string } }).error?.message : "";
    return jsonError(502, `OpenAI couldn't start a voice session${detail ? `: ${detail}` : "."}`);
  }
  const data = (await res.json()) as { value: string; expires_at: number };
  return NextResponse.json(
    { value: data.value, expiresAt: data.expires_at, model: owner.settings.realtimeModel },
    { headers: { "Cache-Control": "no-store" } },
  );
}
