import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.IPM_DB_PATH || join(__dirname, '..', 'data', 'packages.db');

let db;

export function getDb() {
  if (!db) {
    const dataDir = dirname(dbPath);
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    db = new Database(dbPath);
    initSchema(db);
  }
  return db;
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      name TEXT PRIMARY KEY,
      description TEXT,
      version TEXT,
      weekly_downloads INTEGER DEFAULT 0,
      readme TEXT,
      license TEXT,
      repository_url TEXT,
      homepage TEXT,
      fetched_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_packages_name_lower ON packages(LOWER(name));

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
  `);
}

export function searchPackages(database, query, limit = 50) {
  const q = query.trim().toLowerCase();
  if (!q) {
    const stmt = database.prepare(`
      SELECT name, description, version, weekly_downloads as weeklyDownloads
      FROM packages
      ORDER BY weekly_downloads DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
  const stmt = database.prepare(`
    SELECT name, description, version, weekly_downloads as weeklyDownloads
    FROM packages
    WHERE LOWER(name) LIKE ? OR (description IS NOT NULL AND LOWER(description) LIKE ?)
    ORDER BY weekly_downloads DESC
    LIMIT ?
  `);
  const pattern = `%${q}%`;
  return stmt.all(pattern, pattern, limit);
}

export function getPackageByName(database, name) {
  const stmt = database.prepare(`
    SELECT name, description, version, weekly_downloads as weeklyDownloads,
           readme, license as license, repository_url as repositoryUrl, homepage, fetched_at as fetchedAt
    FROM packages
    WHERE LOWER(name) = LOWER(?)
  `);
  const row = stmt.get(name);
  if (!row) return null;
  return row;
}

export function upsertPackage(database, pkg) {
  const stmt = database.prepare(`
    INSERT INTO packages (name, description, version, weekly_downloads, readme, license, repository_url, homepage, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      description = excluded.description,
      version = excluded.version,
      weekly_downloads = excluded.weekly_downloads,
      readme = excluded.readme,
      license = excluded.license,
      repository_url = excluded.repository_url,
      homepage = excluded.homepage,
      fetched_at = excluded.fetched_at
  `);
  const now = Date.now();
  stmt.run(
    pkg.name,
    pkg.description ?? null,
    pkg.version ?? null,
    pkg.weeklyDownloads ?? 0,
    pkg.readme ?? null,
    pkg.license ?? null,
    pkg.repositoryUrl ?? null,
    pkg.homepage ?? null,
    now
  );
}

export function createUser(database, { email, passwordHash, name }) {
  const stmt = database.prepare(`
    INSERT INTO users (email, password_hash, name, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(email.trim().toLowerCase(), passwordHash, name?.trim() || null, Date.now());
  return result.lastInsertRowid;
}

export function getUserByEmail(database, email) {
  const stmt = database.prepare(`
    SELECT id, email, password_hash as passwordHash, name, created_at as createdAt
    FROM users WHERE LOWER(email) = LOWER(?)
  `);
  return stmt.get(email) || null;
}

export function getUserById(database, id) {
  const stmt = database.prepare(`
    SELECT id, email, name, created_at as createdAt
    FROM users WHERE id = ?
  `);
  const row = stmt.get(id);
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, createdAt: row.createdAt };
}
