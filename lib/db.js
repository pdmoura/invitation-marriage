// Tiny storage layer: Postgres when DATABASE_URL is set (recommended in production,
// e.g. a free Supabase database), otherwise a local SQLite file. Queries are written
// with `?` placeholders and portable SQL so both backends run the same statements.

import { mkdirSync } from 'node:fs';
import path from 'node:path';

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS invites (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    seats INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    confirmed_count INTEGER NOT NULL DEFAULT 0,
    guest_names TEXT,
    dietary TEXT,
    message TEXT,
    opened_at TEXT,
    responded_at TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS gifts (
    id TEXT PRIMARY KEY,
    invite_id TEXT,
    guest_name TEXT,
    message TEXT,
    method TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    items TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reference TEXT UNIQUE,
    created_at TEXT NOT NULL,
    paid_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS gifts_invite_idx ON gifts (invite_id)`,
];

async function createPostgres(url) {
  const { default: pg } = await import('pg');
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new pg.Pool({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false }, max: 5 });
  const toPg = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };
  const query = (sql, params = []) => pool.query(toPg(sql), params);
  return {
    kind: 'postgres',
    all: async (sql, params) => (await query(sql, params)).rows,
    get: async (sql, params) => (await query(sql, params)).rows[0],
    run: async (sql, params) => ({ changes: (await query(sql, params)).rowCount }),
    async migrate() {
      for (const stmt of SCHEMA) await pool.query(stmt);
    },
  };
}

async function createSqlite(file) {
  const { DatabaseSync } = await import('node:sqlite');
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;');
  const plain = (row) => (row ? { ...row } : row);
  return {
    kind: 'sqlite',
    all: async (sql, params = []) => db.prepare(sql).all(...params).map(plain),
    get: async (sql, params = []) => plain(db.prepare(sql).get(...params)),
    run: async (sql, params = []) => ({ changes: Number(db.prepare(sql).run(...params).changes) }),
    async migrate() {
      for (const stmt of SCHEMA) db.exec(stmt);
    },
  };
}

export async function openDb({ databaseUrl, sqliteFile }) {
  const db = databaseUrl ? await createPostgres(databaseUrl) : await createSqlite(sqliteFile);
  await db.migrate();
  return db;
}
