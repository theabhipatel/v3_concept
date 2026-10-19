import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { pool } from "@/lib/server/db";
import { jsonError } from "@/lib/server/power";

/** The signed-in user's saved conversations with ABI, newest first. */
export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError(401, "Please sign in again.");
  const { rows } = await pool.query(
    `select id, title, jsonb_array_length(messages) as count, updated_at as "updatedAt"
     from abi_conversation where user_id = $1 order by updated_at desc limit 50`,
    [user.id],
  );
  return NextResponse.json({ conversations: rows }, { headers: { "Cache-Control": "no-store" } });
}
