import "server-only";
import { Pool } from "pg";

// One small pool per server instance (accounts, power settings, saved conversations). Same
// Postgres as the agent; on Vercel use Neon's pooled URL.
const globalForPg = globalThis as unknown as { abiPool?: Pool };

export const pool = (globalForPg.abiPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 3 }));
