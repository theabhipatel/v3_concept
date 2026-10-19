// Creates (or resets) the admin account for the /admin dashboard, directly in the database.
// Run: npm run db:seed-admin   (ADMIN_EMAIL / ADMIN_PASSWORD override the test defaults)
// The test default password is short on purpose for local testing: change it before real use.
import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const email = (process.env.ADMIN_EMAIL || "admin@gmail.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "1234";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const hash = await hashPassword(password);
const now = new Date();

const { rows } = await pool.query(`select id from "user" where email = $1`, [email]);
const id = rows[0]?.id ?? crypto.randomUUID().replace(/-/g, "");
await pool.query(
  `insert into "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
   values ($1, 'Admin', $2, true, 'admin', $3, $3)
   on conflict (id) do update set role = 'admin', "emailVerified" = true, banned = false, "updatedAt" = $3`,
  [id, email, now],
);
const acc = await pool.query(`select id from account where "userId" = $1 and "providerId" = 'credential'`, [id]);
if (acc.rows[0]) await pool.query(`update account set password = $2, "updatedAt" = $3 where id = $1`, [acc.rows[0].id, hash, now]);
else
  await pool.query(
    `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     values ($1, $2, 'credential', $2, $3, $4, $4)`,
    [crypto.randomUUID().replace(/-/g, ""), id, hash, now],
  );
console.log(`admin ready: ${email}${process.env.ADMIN_PASSWORD ? "" : " (test password 1234, change it before going live)"}`);
await pool.end();
