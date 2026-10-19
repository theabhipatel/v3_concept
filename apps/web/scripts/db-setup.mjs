// Sets up the whole database in one go: all tables (migrate-db.mjs), then the admin account when
// ADMIN_EMAIL and ADMIN_PASSWORD are set. Safe to run any number of times.
// Runs on every build (npm run build, so every Vercel deploy) and by hand: npm run db:setup.
// No DATABASE_URL (a preview build, a fresh clone): skips with a note instead of failing.
// The agent creates its own tables (abi_chunks, abi_rate_limits, checkpoints) when it starts.
import pg from "pg";
import { migrate } from "./migrate-db.mjs";
import { seedAdmin } from "./seed-admin.mjs";

if (!process.env.DATABASE_URL) {
  console.log("db setup: no DATABASE_URL, skipped");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await migrate(pool);
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) await seedAdmin(pool, ADMIN_EMAIL, ADMIN_PASSWORD);
  else console.log("admin: ADMIN_EMAIL / ADMIN_PASSWORD not set, skipped");
} finally {
  await pool.end();
}
