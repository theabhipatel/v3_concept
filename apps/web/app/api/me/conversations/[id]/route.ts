import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { pool } from "@/lib/server/db";
import { jsonError } from "@/lib/server/power";

const ID = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_BYTES = 400_000;

type Ctx = RouteContext<"/api/me/conversations/[id]">;

async function owner(ctx: Ctx) {
  const [user, { id }] = await Promise.all([currentUser(), ctx.params]);
  return { user, id: ID.test(id) ? id : null };
}

export async function GET(_: Request, ctx: Ctx) {
  const { user, id } = await owner(ctx);
  if (!user) return jsonError(401, "Please sign in again.");
  const { rows } = await pool.query("select id, title, messages from abi_conversation where id = $1 and user_id = $2", [id, user.id]);
  return rows[0] ? NextResponse.json(rows[0], { headers: { "Cache-Control": "no-store" } }) : jsonError(404, "Not found.");
}

/** Save the whole conversation (the chat sends it after every answer). */
export async function PUT(request: Request, ctx: Ctx) {
  const { user, id } = await owner(ctx);
  if (!user) return jsonError(401, "Please sign in again.");
  if (!id) return jsonError(400, "Invalid conversation id.");
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return jsonError(413, "Conversation is too long to save.");
  const { messages } = JSON.parse(raw || "{}") as { messages?: { role: string; parts: { type: string; text?: string }[] }[] };
  if (!Array.isArray(messages) || !messages.length) return jsonError(400, "Nothing to save.");
  const first = messages.find((m) => m.role === "user");
  const title = (first?.parts.find((p) => p.type === "text")?.text ?? "Conversation").replace(/\s+/g, " ").trim().slice(0, 80);
  // Only the owner can write an id; someone else's id is left alone.
  await pool.query(
    `insert into abi_conversation (id, user_id, title, messages) values ($1, $2, $3, $4)
     on conflict (id) do update set messages = $4, updated_at = now() where abi_conversation.user_id = $2`,
    [id, user.id, title, JSON.stringify(messages.slice(-200))],
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const { user, id } = await owner(ctx);
  if (!user) return jsonError(401, "Please sign in again.");
  await pool.query("delete from abi_conversation where id = $1 and user_id = $2", [id, user.id]);
  return NextResponse.json({ ok: true });
}
