import "server-only";
import { NextResponse } from "next/server";
import { DEFAULT_LIVE_VOICE, DEFAULT_MAIN_MODEL, DEFAULT_REALTIME_MODEL, DEFAULT_VOICE, type PowerSettings } from "@/lib/openai-models";
import { currentUser } from "./auth";
import { pool } from "./db";
import { open } from "./secret-box";

interface Row {
  openai_key: string | null;
  key_hint: string | null;
  enabled: boolean;
  main_model: string | null;
  realtime_model: string | null;
  voice: string | null;
  live_voice: string | null;
}

async function row(userId: string) {
  const { rows } = await pool.query<Row>("select * from abi_power where user_id = $1", [userId]);
  return rows[0];
}

/** Settings as the browser may see them: never the key, only whether one is saved and its hint. */
export async function getPower(userId: string): Promise<PowerSettings> {
  const r = await row(userId);
  return {
    hasKey: Boolean(r?.openai_key),
    keyHint: r?.key_hint ?? null,
    enabled: Boolean(r?.openai_key && r.enabled),
    mainModel: r?.main_model || DEFAULT_MAIN_MODEL,
    realtimeModel: r?.realtime_model || DEFAULT_REALTIME_MODEL,
    voice: r?.voice || DEFAULT_VOICE,
    liveVoice: r?.live_voice || DEFAULT_LIVE_VOICE,
  };
}

/** The user's decrypted key and settings, for server-side calls to OpenAI only. */
export async function getOwnerKey(userId: string) {
  const r = await row(userId);
  if (!r?.openai_key) return null;
  return { key: open(r.openai_key, userId), settings: await getPower(userId) };
}

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * For power routes: the signed-in user with a saved key and power mode on. Returns a ready
 * error response otherwise.
 */
export async function requirePower(): Promise<
  { error: NextResponse; owner?: never } | { error?: never; owner: { userId: string; key: string; settings: PowerSettings } }
> {
  const user = await currentUser();
  if (!user) return { error: jsonError(401, "Sign in to use power mode.") };
  const found = await getOwnerKey(user.id);
  if (!found) return { error: jsonError(403, "Add your OpenAI key in ABI settings first.") };
  if (!found.settings.enabled) return { error: jsonError(403, "Power mode is off.") };
  return { owner: { userId: user.id, ...found } };
}

export async function openaiFetch(key: string, path: string, init: RequestInit = {}) {
  return fetch(`https://api.openai.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, ...init.headers },
    cache: "no-store",
  });
}
