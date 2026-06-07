import { Pool } from 'pg';

// Direct connection to Render PostgreSQL — same DB that the PHP backend uses.
// Used as a fallback when Render's PHP is on an old deploy without the
// support-tickets endpoint.
const pool = new Pool({
  host:     process.env.RENDER_DB_HOST ?? 'dpg-d8elmin40ujc73dnk170-a.ohio-postgres.render.com',
  port:     Number(process.env.RENDER_DB_PORT ?? 5432),
  database: process.env.RENDER_DB_NAME ?? 'creva_webzz',
  user:     process.env.RENDER_DB_USER ?? 'creva_webzz_user',
  password: process.env.RENDER_DB_PASS ?? 'ez1k4mPaR3hpj0D6A92Kv0vOiDaUOjEI',
  ssl:      { rejectUnauthorized: false },
  max:      3,
  idleTimeoutMillis:    20000,
  connectionTimeoutMillis: 8000,
});

let schemaDone = false;

// Create support-ticket tables if they don't exist yet.
// Runs once per warm serverless instance; idempotent on repeat calls.
export async function ensureSupportSchema(): Promise<void> {
  if (schemaDone) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        id            TEXT PRIMARY KEY,
        ticket_number TEXT,
        store_id      TEXT,
        owner_id      TEXT,
        owner_email   TEXT,
        store_name    TEXT,
        subject       TEXT,
        category      TEXT    DEFAULT 'other',
        priority      TEXT    DEFAULT 'medium',
        status        TEXT    DEFAULT 'open',
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "support_messages" (
        id          TEXT PRIMARY KEY,
        ticket_id   TEXT,
        sender_id   TEXT,
        sender_role TEXT DEFAULT 'owner',
        sender_name TEXT,
        message     TEXT,
        attachments TEXT DEFAULT '[]',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "support_notifications" (
        id         TEXT PRIMARY KEY,
        type       TEXT,
        for_role   TEXT,
        store_id   TEXT,
        ticket_id  TEXT,
        title      TEXT,
        body       TEXT,
        is_read    BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    schemaDone = true;
  } finally {
    client.release();
  }
}

export { pool };
