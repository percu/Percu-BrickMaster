import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('data');
fs.mkdirSync(dataDir, { recursive: true });
export const db = new Database(path.join(dataDir, 'brickmaster.db'));
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS sets (
  set_num TEXT PRIMARY KEY, name TEXT NOT NULL, year INTEGER, num_parts INTEGER,
  image_url TEXT, owned_quantity INTEGER NOT NULL DEFAULT 0, synced_at TEXT
);
CREATE TABLE IF NOT EXISTS parts (
  element_id TEXT PRIMARY KEY, design_id TEXT NOT NULL, base_id TEXT NOT NULL,
  color_id INTEGER, color_name TEXT, part_num TEXT, name TEXT, image_url TEXT,
  is_mold_specific_protected INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS inventories (
  id INTEGER PRIMARY KEY AUTOINCREMENT, set_num TEXT NOT NULL REFERENCES sets(set_num) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES parts(element_id), quantity INTEGER NOT NULL,
  color_id INTEGER, is_spare INTEGER NOT NULL DEFAULT 0,
  UNIQUE(set_num, element_id, is_spare)
);
CREATE TABLE IF NOT EXISTS wishlist (
  set_num TEXT PRIMARY KEY REFERENCES sets(set_num) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_parts_design ON parts(design_id);
CREATE INDEX IF NOT EXISTS idx_parts_base ON parts(base_id);
CREATE INDEX IF NOT EXISTS idx_inventory_element ON inventories(element_id);
`);

// Lightweight migration for databases created before set notes were introduced.
try { db.exec("ALTER TABLE sets ADD COLUMN notes TEXT NOT NULL DEFAULT ''"); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
