import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.IPM_DB_PATH || join(__dirname, '..', 'data', 'packages.db');

if (!existsSync(dbPath)) {
  console.log('No database file found. Nothing to clear.');
  process.exit(0);
}

const db = new Database(dbPath);
const result = db.prepare('DELETE FROM packages').run();
db.close();

console.log(`Cleared ${result.changes} package(s) from the database.`);
