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
CREATE TABLE IF NOT EXISTS owned_set_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  set_num TEXT NOT NULL REFERENCES sets(set_num) ON DELETE CASCADE,
  notes TEXT NOT NULL DEFAULT '',
  custom_label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  purchase_date TEXT NOT NULL DEFAULT '',
  purchase_place TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS owned_set_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owned_set_id INTEGER NOT NULL REFERENCES owned_set_instances(id) ON DELETE CASCADE,
  element_id TEXT NOT NULL REFERENCES parts(element_id),
  quantity INTEGER NOT NULL,
  owned_quantity INTEGER NOT NULL,
  is_spare INTEGER NOT NULL DEFAULT 0,
  condition TEXT NOT NULL DEFAULT 'complete',
  notes TEXT NOT NULL DEFAULT '',
  UNIQUE(owned_set_id, element_id, is_spare)
);
CREATE INDEX IF NOT EXISTS idx_parts_design ON parts(design_id);
CREATE INDEX IF NOT EXISTS idx_parts_base ON parts(base_id);
CREATE INDEX IF NOT EXISTS idx_inventory_element ON inventories(element_id);
CREATE INDEX IF NOT EXISTS idx_owned_set_parts_element ON owned_set_parts(element_id);
`);

// Lightweight migration for databases created before set notes were introduced.
try { db.exec("ALTER TABLE sets ADD COLUMN notes TEXT NOT NULL DEFAULT ''"); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.exec('ALTER TABLE inventories ADD COLUMN owned_quantity INTEGER'); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.exec("ALTER TABLE inventories ADD COLUMN condition TEXT NOT NULL DEFAULT 'complete'"); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
try { db.exec("ALTER TABLE inventories ADD COLUMN notes TEXT NOT NULL DEFAULT ''"); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
for (const column of ['custom_label', 'description', 'purchase_date', 'purchase_place', 'price', 'category', 'location']) {
  try { db.exec(`ALTER TABLE owned_set_instances ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`); } catch (error) { if (!String(error.message).includes('duplicate column name')) throw error; }
}
db.exec(`UPDATE inventories SET owned_quantity = quantity * COALESCE((SELECT owned_quantity FROM sets WHERE sets.set_num=inventories.set_num), 0) WHERE owned_quantity IS NULL`);

// One-time migration from the former aggregate ownership model. Each owned copy
// becomes a distinct instance; available parts are allocated across instances.
if (db.prepare('SELECT COUNT(*) AS count FROM owned_set_instances').get().count === 0) {
  const existingSets = db.prepare('SELECT * FROM sets WHERE owned_quantity>0').all();
  const makeInstance = db.prepare('INSERT INTO owned_set_instances(set_num,notes) VALUES(?,?)');
  const rowsForSet = db.prepare('SELECT * FROM inventories WHERE set_num=?');
  const addPart = db.prepare('INSERT INTO owned_set_parts(owned_set_id,element_id,quantity,owned_quantity,is_spare,condition,notes) VALUES(?,?,?,?,?,?,?)');
  const migrate = db.transaction(() => existingSets.forEach(set => {
    const rows = rowsForSet.all(set.set_num);
    const remaining = new Map(rows.map(row => [`${row.element_id}:${row.is_spare}`, Number(row.owned_quantity || 0)]));
    for (let index = 0; index < Number(set.owned_quantity); index += 1) {
      const instance = makeInstance.run(set.set_num, index === 0 ? set.notes || '' : '');
      rows.forEach(row => {
        const key = `${row.element_id}:${row.is_spare}`;
        const available = remaining.get(key) || 0;
        const assigned = Math.min(Number(row.quantity), available);
        remaining.set(key, Math.max(0, available - assigned));
        const condition = assigned < Number(row.quantity) ? (row.condition || 'missing') : 'complete';
        addPart.run(instance.lastInsertRowid, row.element_id, row.quantity, assigned, row.is_spare, condition, index === 0 ? row.notes || '' : '');
      });
    }
  }));
  migrate();
}
