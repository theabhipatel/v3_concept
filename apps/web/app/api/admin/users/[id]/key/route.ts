import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { pool } from "@/lib/server/db";

/** An admin removes a user's OpenAI key (it is deleted, never shown) and turns their power off. */
export async function DELETE(_: Request, ctx: RouteContext<"/api/admin/users/[id]/key">) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  await pool.query("update abi_power set openai_key = null, key_hint = null, enabled = false, updated_at = now() where user_id = $1", [id]);
  return NextResponse.json({ ok: true });
}
