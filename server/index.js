import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { db } from './db.js';
import { rb } from './rebrickable.js';
import { cacheImage, imagePath } from './images.js';

const app = express();
app.use(cors()); app.use(express.json());
const PORT = Number(process.env.PORT || 3001);
const syntheticId = (design, color) => `UnknownElement-${design || 'unknown'}-${color ?? 'unknown'}`;

function storeSet(record, owned = false) {
  db.prepare(`INSERT INTO sets(set_num,name,year,num_parts,image_url,owned_quantity,synced_at) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(set_num) DO UPDATE SET name=excluded.name,year=excluded.year,num_parts=excluded.num_parts,image_url=excluded.image_url,
    owned_quantity=CASE WHEN ? THEN sets.owned_quantity + 1 ELSE sets.owned_quantity END,synced_at=excluded.synced_at`)
    .run(record.set_num, record.name, record.year, record.num_parts, record.set_img_url, owned ? 1 : 0, new Date().toISOString(), owned ? 1 : 0);
}
async function syncSet(setNum, owned = false) {
  const { data: set } = await rb(`/sets/${encodeURIComponent(setNum)}/`);
  storeSet(set, owned);
  const existing = db.prepare('SELECT 1 FROM inventories WHERE set_num=? LIMIT 1').get(setNum);
  if (existing) { db.prepare('DELETE FROM inventories WHERE set_num=? AND is_spare=1').run(setNum); return set; }
  let url = `/sets/${encodeURIComponent(setNum)}/parts/?page_size=1000`;
  const partRows = [];
  while (url) { const response = await rb(url); partRows.push(...response.data.results); url = response.data.next ? response.data.next.replace('https://rebrickable.com/api/v3/lego', '') : null; }
  const putPart = db.prepare(`INSERT INTO parts(element_id,design_id,base_id,color_id,color_name,part_num,name,image_url,is_mold_specific_protected)
    VALUES(@element_id,@design_id,@base_id,@color_id,@color_name,@part_num,@name,@image_url,0)
    ON CONFLICT(element_id) DO UPDATE SET color_id=excluded.color_id,color_name=excluded.color_name,name=excluded.name,image_url=COALESCE(excluded.image_url,parts.image_url)`);
  const putInventory = db.prepare('INSERT OR REPLACE INTO inventories(set_num,element_id,quantity,color_id,is_spare) VALUES(?,?,?,?,?)');
  const tx = db.transaction(() => partRows.forEach(row => {
    if (row.is_spare) return;
    const design = String(row.part?.part_num || row.part?.part_num || 'unknown');
    const element = String(row.element_id || syntheticId(design, row.color?.id));
    putPart.run({ element_id: element, design_id: design, base_id: design, color_id: row.color?.id ?? null, color_name: row.color?.name ?? 'Unknown', part_num: row.part?.part_num ?? design, name: row.part?.name ?? design, image_url: row.part?.part_img_url ?? null });
    putInventory.run(setNum, element, row.quantity, row.color?.id ?? null, 0);
  })); tx();
  return set;
}

app.get('/api/health', (_, res) => res.json({ ok: true, configured: Boolean(process.env.REBRICKABLE_API_KEY) }));
app.post('/api/sets/owned', async (req, res, next) => { try { const set = await syncSet(req.body.set_num, true); res.status(201).json(set); } catch (e) { next(e); } });
app.post('/api/wishlist', async (req, res, next) => { try { const set = await syncSet(req.body.set_num); db.prepare('INSERT OR IGNORE INTO wishlist(set_num) VALUES(?)').run(set.set_num); res.status(201).json(set); } catch (e) { next(e); } });
app.get('/api/sets/owned', (_, res) => res.json(db.prepare('SELECT * FROM sets WHERE owned_quantity > 0 ORDER BY name').all()));
app.patch('/api/sets/:setNum', (req, res) => {
  const current = db.prepare('SELECT * FROM sets WHERE set_num=?').get(req.params.setNum);
  if (!current) return res.status(404).json({ error: 'Set not found' });
  const quantity = req.body.owned_quantity === undefined ? current.owned_quantity : Math.max(0, Number(req.body.owned_quantity) || 0);
  const notes = req.body.notes === undefined ? current.notes : String(req.body.notes);
  db.prepare('UPDATE sets SET owned_quantity=?, notes=? WHERE set_num=?').run(quantity, notes, req.params.setNum);
  res.json(db.prepare('SELECT * FROM sets WHERE set_num=?').get(req.params.setNum));
});
app.get('/api/sets/:setNum/parts', (req, res) => res.json(db.prepare(`
  SELECT i.element_id, i.quantity, i.is_spare, p.name, p.design_id, p.color_name,
    COALESCE((SELECT SUM(oi.quantity * os.owned_quantity) FROM inventories oi JOIN sets os ON os.set_num=oi.set_num WHERE oi.element_id=i.element_id AND oi.is_spare=0 AND os.owned_quantity>0), 0) AS total_owned
  FROM inventories i JOIN parts p ON p.element_id=i.element_id
  WHERE i.set_num=? ORDER BY i.is_spare, p.name
`).all(req.params.setNum)));
app.get('/api/wishlist', (_, res) => res.json(db.prepare(`SELECT s.* FROM wishlist w JOIN sets s ON s.set_num=w.set_num ORDER BY w.added_at DESC`).all()));
app.delete('/api/wishlist/:setNum', (req, res) => { db.prepare('DELETE FROM wishlist WHERE set_num=?').run(req.params.setNum); res.status(204).end(); });

app.get('/api/inventory', (req, res) => {
  const group = req.query.group === 'design' ? 'design_id' : 'element_id';
  const rows = db.prepare(`SELECT p.${group} AS key, MIN(p.element_id) AS element_id, MIN(p.name) AS name, MIN(p.design_id) AS design_id, MIN(p.base_id) AS base_id, MIN(p.color_name) AS color_name, SUM(i.quantity*s.owned_quantity) AS quantity
    FROM inventories i JOIN sets s ON s.set_num=i.set_num JOIN parts p ON p.element_id=i.element_id WHERE s.owned_quantity>0 AND i.is_spare=0 GROUP BY p.${group} ORDER BY quantity DESC`).all();
  res.json(rows);
});
app.get('/api/inventory/:elementId/breakdown', (req, res) => res.json(db.prepare(`SELECT s.set_num,s.name,s.image_url,s.owned_quantity,i.quantity,(s.owned_quantity*i.quantity) AS total FROM inventories i JOIN sets s ON s.set_num=i.set_num WHERE i.element_id=? AND s.owned_quantity>0`).all(req.params.elementId)));
app.patch('/api/parts/:elementId/normalization', (req, res) => {
  const { base_id, is_mold_specific_protected } = req.body;
  db.prepare('UPDATE parts SET base_id=COALESCE(?,base_id),is_mold_specific_protected=COALESCE(?,is_mold_specific_protected) WHERE element_id=?').run(base_id, is_mold_specific_protected === undefined ? null : Number(Boolean(is_mold_specific_protected)), req.params.elementId);
  res.json(db.prepare('SELECT * FROM parts WHERE element_id=?').get(req.params.elementId));
});

function completeness(setNum) {
  const needed = db.prepare(`SELECT p.*,SUM(i.quantity) quantity FROM inventories i JOIN parts p ON p.element_id=i.element_id WHERE i.set_num=? AND i.is_spare=0 GROUP BY i.element_id`).all(setNum);
  const owned = db.prepare(`SELECT p.*,SUM(i.quantity*s.owned_quantity) quantity FROM inventories i JOIN sets s ON s.set_num=i.set_num JOIN parts p ON p.element_id=i.element_id WHERE s.owned_quantity>0 AND i.is_spare=0 GROUP BY i.element_id`).all();
  const required = needed.reduce((sum, x) => sum + x.quantity, 0); if (!required) return { strict: 0, loose: 0, required: 0, matched_strict: 0, matched_loose: 0 };
  const strict = needed.reduce((sum, n) => sum + Math.min(n.quantity, owned.find(o => o.element_id === n.element_id)?.quantity || 0), 0);
  const ownedByKey = new Map();
  for (const o of owned) { const key = o.is_mold_specific_protected ? `d:${o.design_id}` : `b:${o.base_id}`; ownedByKey.set(key, (ownedByKey.get(key) || 0) + o.quantity); }
  const loose = needed.reduce((sum, n) => { const key = n.is_mold_specific_protected ? `d:${n.design_id}` : `b:${n.base_id}`; const available = ownedByKey.get(key) || 0; const hit = Math.min(n.quantity, available); ownedByKey.set(key, available - hit); return sum + hit; }, 0);
  return { strict: Math.round(strict / required * 1000) / 10, loose: Math.round(loose / required * 1000) / 10, required, matched_strict: strict, matched_loose: loose };
}
app.get('/api/wishlist/:setNum/completeness', (req, res) => res.json(completeness(req.params.setNum)));
app.get('/images/:elementId/:size', async (req, res, next) => { try {
  const thumb = req.params.size === 'thumb'; const file = imagePath(req.params.elementId, thumb);
  if (!fs.existsSync(file)) { const p = db.prepare('SELECT image_url FROM parts WHERE element_id=?').get(req.params.elementId); await cacheImage(req.params.elementId, p?.image_url); }
  const result = imagePath(req.params.elementId, thumb); if (!fs.existsSync(result)) return res.status(404).end(); res.sendFile(path.resolve(result));
} catch (e) { next(e); } });
const dist = path.resolve('dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('/{*splat}', (_, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use((err, _, res, __) => res.status(400).json({ error: err.message || 'Request failed' }));
app.listen(PORT, () => console.log(`BrickMaster API running at http://localhost:${PORT}`));
