import { NextResponse } from "next/server";
import { REALTIME_TOOLS } from "@/lib/realtime-tools";
import { jsonError, openaiFetch, requirePower } from "@/lib/server/power";
import { LIVE_VOICE_INSTRUCTIONS, VOICE_INSTRUCTIONS } from "@/lib/server/voice-session";

/**
 * GPT-Live (gpt-live-1) over WebRTC: the browser sends its SDP offer here, the server opens the
 * session with the user's key and returns OpenAI's SDP answer. The voice layer delegates work to
 * the user's main model through the Responses API, with ABI's page tools (run in the browser).
 */
export async function POST(request: Request) {
  const { owner, error } = await requirePower();
  if (error) return error;
  const { sdp } = (await request.json().catch(() => ({}))) as { sdp?: string };
  if (!sdp || sdp.length > 20_000) return jsonError(400, "Missing connection offer.");
  const res = await openaiFetch(owner.key, "/live/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session: {
        model: owner.settings.realtimeModel,
        instructions: LIVE_VOICE_INSTRUCTIONS,
        audio: { output: { voice: owner.settings.liveVoice } },
        delegation: {
          type: "responses",
          responses: {
            model: owner.settings.mainModel,
            instructions: VOICE_INSTRUCTIONS,
            tools: REALTIME_TOOLS,
            tool_choice: "auto",
            parallel_tool_calls: false,
          },
        },
      },
      transport: { type: "webrtc", sdp },
    }),
  }).catch(() => null);
  if (!res?.ok) {
    const detail = res ? ((await res.json().catch(() => ({}))) as { error?: { message?: string } }).error?.message : "";
    return jsonError(502, `OpenAI couldn't start GPT-Live${detail ? `: ${detail}` : "."}`);
  }
  const data = (await res.json()) as { session?: { id?: string }; transport?: { sdp?: string } };
  if (!data.transport?.sdp) return jsonError(502, "OpenAI didn't return a connection answer.");
  return NextResponse.json({ sdp: data.transport.sdp }, { headers: { "Cache-Control": "no-store" } });
}
