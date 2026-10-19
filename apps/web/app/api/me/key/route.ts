import { NextResponse } from "next/server";
import { DEFAULT_MAIN_MODEL } from "@/lib/openai-models";
import { currentUser } from "@/lib/server/auth";
import { pool } from "@/lib/server/db";
import { getPower, jsonError, openaiFetch } from "@/lib/server/power";
import { seal } from "@/lib/server/secret-box";

const KEY_RE = /^sk-[A-Za-z0-9_-]{20,300}$/;

/** Test a key against OpenAI (listing models costs nothing), then save it encrypted. */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError(401, "Please sign in again.");
  const { key } = (await request.json().catch(() => ({}))) as { key?: string };
  const clean = String(key ?? "").trim();
  if (!KEY_RE.test(clean)) return jsonError(400, "That doesn't look like an OpenAI key. It starts with sk-.");

  let res: Response;
  try {
    res = await openaiFetch(clean, "/models");
  } catch {
    return jsonError(502, "Couldn't reach OpenAI. Try again in a moment.");
  }
  if (res.status === 401) return jsonError(400, "OpenAI rejected this key. Check it and try again.");
  if (!res.ok) return jsonError(400, `OpenAI answered with an error (${res.status}). Try again later.`);
  const ids: string[] = ((await res.json()).data ?? []).map((m: { id: string }) => m.id);

  const hint = `${clean.slice(0, 3)}...${clean.slice(-4)}`;
  await pool.query(
    `insert into abi_power (user_id, openai_key, key_hint) values ($1, $2, $3)
     on conflict (user_id) do update set openai_key = $2, key_hint = $3, updated_at = now()`,
    [user.id, seal(clean, user.id), hint],
  );
  return NextResponse.json({ ok: true, models: ids.length, hasDefault: ids.includes(DEFAULT_MAIN_MODEL), power: await getPower(user.id) });
}

/** Remove the key for good. Power mode switches off with it. */
export async function DELETE() {
  const user = await currentUser();
  if (!user) return jsonError(401, "Please sign in again.");
  await pool.query("update abi_power set openai_key = null, key_hint = null, enabled = false, updated_at = now() where user_id = $1", [user.id]);
  return NextResponse.json({ ok: true, power: await getPower(user.id) });
}
