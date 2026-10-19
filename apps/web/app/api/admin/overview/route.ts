import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { pool } from "@/lib/server/db";

/** Numbers and the user list for the admin dashboard. Never returns keys or conversation text. */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const [stats, power, chats, days, users] = await Promise.all([
    pool.query(`select count(*)::int as total,
        count(*) filter (where "emailVerified")::int as verified,
        count(*) filter (where banned)::int as banned,
        count(*) filter (where role = 'admin')::int as admins,
        count(*) filter (where "createdAt" > now() - interval '7 days')::int as "newThisWeek"
      from "user"`),
    pool.query(`select count(*) filter (where openai_key is not null)::int as keys,
        count(*) filter (where enabled and openai_key is not null)::int as powered from abi_power`),
    pool.query(`select count(*)::int as conversations from abi_conversation`),
    pool.query(`select to_char(d, 'YYYY-MM-DD') as day, count(u.id)::int as count
      from generate_series(current_date - 13, current_date, interval '1 day') d
      left join "user" u on u."createdAt"::date = d::date group by d order by d`),
    pool.query(`select u.id, u.name, u.email, u."emailVerified" as verified, coalesce(u.role, 'user') as role,
        coalesce(u.banned, false) as banned, u."banReason" as "banReason", u."createdAt" as "createdAt",
        coalesce((select array_agg(distinct a."providerId") from account a where a."userId" = u.id), '{}') as providers,
        (p.openai_key is not null) as "hasKey", coalesce(p.enabled and p.openai_key is not null, false) as powered,
        p.main_model as "mainModel", p.realtime_model as "voiceModel",
        (select count(*)::int from abi_conversation c where c.user_id = u.id) as chats,
        (select max(s."updatedAt") from session s where s."userId" = u.id) as "lastActive",
        (select count(*)::int from session s where s."userId" = u.id and s."expiresAt" > now()) as sessions
      from "user" u left join abi_power p on p.user_id = u.id
      order by u."createdAt" desc limit 500`),
  ]);
  return NextResponse.json(
    { stats: { ...stats.rows[0], ...power.rows[0], ...chats.rows[0] }, signups: days.rows, users: users.rows },
    { headers: { "Cache-Control": "no-store" } },
  );
}
