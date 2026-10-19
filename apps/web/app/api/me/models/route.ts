import { NextResponse } from "next/server";
import { classifyModels } from "@/lib/openai-models";
import { currentUser } from "@/lib/server/auth";
import { getOwnerKey, jsonError, openaiFetch } from "@/lib/server/power";

/** The models this user's key can use, live from OpenAI, with prices from our table. */
export async function GET() {
  const user = await currentUser();
  if (!user) return jsonError(401, "Please sign in again.");
  const found = await getOwnerKey(user.id);
  if (!found) return jsonError(403, "Add your OpenAI key first.");
  const res = await openaiFetch(found.key, "/models").catch(() => null);
  if (!res?.ok) return jsonError(502, "Couldn't load models from OpenAI right now.");
  const ids: string[] = ((await res.json()).data ?? []).map((m: { id: string }) => m.id);
  return NextResponse.json(classifyModels(ids), { headers: { "Cache-Control": "no-store" } });
}
