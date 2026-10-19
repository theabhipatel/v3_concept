import { NextResponse } from "next/server";
import { z } from "zod";
import { LIVE_VOICES, VOICES } from "@/lib/openai-models";
import { currentUser } from "@/lib/server/auth";
import { pool } from "@/lib/server/db";
import { getPower, jsonError } from "@/lib/server/power";

const MODEL = z.string().regex(/^[A-Za-z0-9._:-]{1,80}$/);
const Body = z.object({
  enabled: z.boolean().optional(),
  mainModel: MODEL.optional(),
  realtimeModel: MODEL.optional(),
  voice: z.enum(VOICES).optional(),
  liveVoice: z.enum(LIVE_VOICES).optional(),
});

/** Power switch and model choices. Power can only turn on while a key is saved. */
export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return jsonError(401, "Please sign in again.");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(400, "Invalid settings.");
  const b = parsed.data;
  const current = await getPower(user.id);
  if (b.enabled && !current.hasKey) return jsonError(400, "Add your OpenAI key first.");
  await pool.query(
    `insert into abi_power (user_id, enabled, main_model, realtime_model, voice, live_voice)
     values ($1, coalesce($2, false), $3, $4, $5, $6)
     on conflict (user_id) do update set
       enabled = coalesce($2, abi_power.enabled),
       main_model = coalesce($3, abi_power.main_model),
       realtime_model = coalesce($4, abi_power.realtime_model),
       voice = coalesce($5, abi_power.voice),
       live_voice = coalesce($6, abi_power.live_voice),
       updated_at = now()`,
    [user.id, b.enabled ?? null, b.mainModel ?? null, b.realtimeModel ?? null, b.voice ?? null, b.liveVoice ?? null],
  );
  return NextResponse.json({ power: await getPower(user.id) });
}
