import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH =
  process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'todo.db');

// Next's dev server reloads modules on every change; cache the connection
// on globalThis so we don't reopen the database each time.
const g = globalThis as unknown as { __db?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!g.__db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    const schema = fs.readFileSync(
      path.join(process.cwd(), 'db', 'schema.sql'),
      'utf8',
    );
    db.exec(schema);
    g.__db = db;
  }
  return g.__db;
}