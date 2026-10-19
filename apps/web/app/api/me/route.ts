import { NextResponse } from "next/server";
import { currentUser, googleEnabled } from "@/lib/server/auth";
import { getPower } from "@/lib/server/power";

/** Who is signed in, and their power settings (never the key itself). */
export async function GET() {
  const user = await currentUser();
  const body = user
    ? { user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null }, power: await getPower(user.id), googleEnabled }
    : { user: null, power: null, googleEnabled };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
