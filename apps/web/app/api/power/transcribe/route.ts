import { NextResponse } from "next/server";
import { TRANSCRIBE_MODEL } from "@/lib/openai-models";
import { jsonError, openaiFetch, requirePower } from "@/lib/server/power";

const MAX_BYTES = 4_000_000;

/** Push-to-talk in power mode: OpenAI speech-to-text with the user's key. Audio is not stored. */
export async function POST(request: Request) {
  const { owner, error } = await requirePower();
  if (error) return error;
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || !audio.size || audio.size > MAX_BYTES) return jsonError(413, "Recording is empty or too long.");
  const body = new FormData();
  body.append("file", audio, (audio as File).name || "speech.webm");
  body.append("model", TRANSCRIBE_MODEL);
  body.append("language", "en");
  const res = await openaiFetch(owner.key, "/audio/transcriptions", { method: "POST", body }).catch(() => null);
  if (!res?.ok) return jsonError(502, "OpenAI couldn't transcribe that. Please try again.");
  const data = await res.json();
  return NextResponse.json({ text: String(data.text ?? "").trim() });
}
