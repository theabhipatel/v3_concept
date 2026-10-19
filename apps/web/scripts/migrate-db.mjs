// Creates the tables for accounts (Better Auth), power settings and saved conversations.
// Safe to run again: only missing tables and columns are added.
// Run: npm run db:migrate   (reads DATABASE_URL from .env.local)
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Same tables as lib/server/auth.ts (Google sign-in adds no tables of its own).
const { runMigrations, toBeCreated, toBeAdded } = await getMigrations(
  betterAuth({ database: pool, emailAndPassword: { enabled: true } }).options,
);
console.log("auth tables:", toBeCreated.map((t) => t.table).join(", ") || "up to date", toBeAdded.length ? `(+${toBeAdded.length} changes)` : "");
await runMigrations();

await pool.query(`
  create table if not exists abi_power (
    user_id text primary key references "user"(id) on delete cascade,
    openai_key text,
    key_hint text,
    enabled boolean not null default false,
    main_model text,
    realtime_model text,
    voice text,
    updated_at timestamptz not null default now()
  );
  create table if not exists abi_conversation (
    id text primary key,
    user_id text not null references "user"(id) on delete cascade,
    title text not null,
    messages jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create index if not exists abi_conversation_user on abi_conversation (user_id, updated_at desc);
  alter table abi_power add column if not exists live_voice text;
`);
console.log("abi_power, abi_conversation: ready");
await pool.end();
