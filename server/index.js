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
async function syncSet(setNum, owned = false, includeSpares = false) {
  const { data: set } = await rb(`/sets/${encodeURIComponent(setNum)}/`);
  storeSet(set, owned);
  const existing = db.prepare('SELECT 1 FROM inventories WHERE set_num=? LIMIT 1').get(setNum);
  if (existing && owned) db.prepare('UPDATE inventories SET owned_quantity=MIN(quantity * (SELECT owned_quantity FROM sets WHERE set_num=?), owned_quantity + quantity) WHERE set_num=? AND is_spare=0').run(setNum, setNum);
  if (existing && !includeSpares) {
    return set;
  }
  let url = `/sets/${encodeURIComponent(setNum)}/parts/?page_size=1000`;
  const partRows = [];
  while (url) { const response = await rb(url); partRows.push(...response.data.results); url = response.data.next ? response.data.next.replace('https://rebrickable.com/api/v3/lego', '') : null; }
  const putPart = db.prepare(`INSERT INTO parts(element_id,design_id,base_id,color_id,color_name,part_num,name,image_url,is_mold_specific_protected)
    VALUES(@element_id,@design_id,@base_id,@color_id,@color_name,@part_num,@name,@image_url,0)
    ON CONFLICT(element_id) DO UPDATE SET color_id=excluded.color_id,color_name=excluded.color_name,name=excluded.name,image_url=COALESCE(excluded.image_url,parts.image_url)`);
  const putInventory = db.prepare('INSERT OR REPLACE INTO inventories(set_num,element_id,quantity,owned_quantity,color_id,is_spare) VALUES(?,?,?,?,?,?)');
  const tx = db.transaction(() => partRows.forEach(row => {
    if (row.is_spare && !includeSpares) return;
    if (existing && !row.is_spare) return;
    const design = String(row.part?.part_num || row.part?.part_num || 'unknown');
    const element = String(row.element_id || syntheticId(design, row.color?.id));
    putPart.run({ element_id: element, design_id: design, base_id: design, color_id: row.color?.id ?? null, color_name: row.color?.name ?? 'Unknown', part_num: row.part?.part_num ?? design, name: row.part?.name ?? design, image_url: row.part?.part_img_url ?? null });
    putInventory.run(setNum, element, row.quantity, owned ? row.quantity : 0, row.color?.id ?? null, Number(Boolean(row.is_spare)));
  })); tx();
  return set;
}

function createOwnedSetInstance(setNum, includeSpares = false, metadata = {}) {
  const instance = db.prepare(`INSERT INTO owned_set_instances(set_num,custom_label,description,purchase_date,purchase_place,price,category,location)
    VALUES(?,?,?,?,?,?,?,?)`).run(setNum, ...['custom_label', 'description', 'purchase_date', 'purchase_place', 'price', 'category', 'location'].map(key => String(metadata[key] || '')));
  const sourceParts = db.prepare('SELECT element_id,quantity,is_spare FROM inventories WHERE set_num=? AND (is_spare=0 OR ?)').all(setNum, Number(includeSpares));
  const addPart = db.prepare('INSERT INTO owned_set_parts(owned_set_id,element_id,quantity,owned_quantity,is_spare) VALUES(?,?,?,?,?)');
  db.transaction(() => sourceParts.forEach(part => addPart.run(instance.lastInsertRowid, part.element_id, part.quantity, part.quantity, part.is_spare)))();
  return instance.lastInsertRowid;
}

app.get('/api/health', (_, res) => res.json({ ok: true, configured: Boolean(process.env.REBRICKABLE_API_KEY) }));
app.get('/api/categories', (_, res) => {
  const tags = new Map();
  db.prepare("SELECT category FROM owned_set_instances WHERE TRIM(category) <> ''").all().forEach(({ category }) => String(category).split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => {
    if (!tags.has(tag.toLowerCase())) tags.set(tag.toLowerCase(), tag);
  }));
  res.json([...tags.values()].sort((a, b) => a.localeCompare(b)));
});
app.post('/api/sets/owned', async (req, res, next) => { try { const set = await syncSet(req.body.set_num, false, Boolean(req.body.include_spares)); const instanceId = createOwnedSetInstance(set.set_num, Boolean(req.body.include_spares), req.body); res.status(201).json({ ...set, instance_id: instanceId }); } catch (e) { next(e); } });
app.post('/api/wishlist', async (req, res, next) => { try { const set = await syncSet(req.body.set_num, false, Boolean(req.body.include_spares)); db.prepare('INSERT OR IGNORE INTO wishlist(set_num) VALUES(?)').run(set.set_num); res.status(201).json(set); } catch (e) { next(e); } });
app.get('/api/sets/owned', (_, res) => res.json(db.prepare(`SELECT osi.id AS instance_id,s.*,1 AS owned_quantity,osi.notes,osi.custom_label,osi.description,osi.purchase_date,osi.purchase_place,osi.price,osi.category,osi.location,COALESCE((SELECT SUM(MAX(0,osp.quantity-osp.owned_quantity)) FROM owned_set_parts osp WHERE osp.owned_set_id=osi.id AND osp.is_spare=0 AND osp.condition IN ('missing','broken')),0) AS missing_parts,COALESCE((SELECT SUM(osp.quantity) FROM owned_set_parts osp WHERE osp.owned_set_id=osi.id AND osp.is_spare=1),0) AS spare_parts FROM owned_set_instances osi JOIN sets s ON s.set_num=osi.set_num ORDER BY s.name,osi.id`).all()));
app.patch('/api/owned-sets/:instanceId', (req, res) => {
  const instance = db.prepare('SELECT osi.id AS instance_id,s.*,1 AS owned_quantity,osi.notes,osi.custom_label,osi.description,osi.purchase_date,osi.purchase_place,osi.price,osi.category,osi.location FROM owned_set_instances osi JOIN sets s ON s.set_num=osi.set_num WHERE osi.id=?').get(req.params.instanceId);
  if (!instance) return res.status(404).json({ error: 'Owned set not found' });
  const fields = ['notes', 'custom_label', 'description', 'purchase_date', 'purchase_place', 'price', 'category', 'location'];
  const updated = Object.fromEntries(fields.map(field => [field, req.body[field] === undefined ? instance[field] : String(req.body[field]) ]));
  db.prepare(`UPDATE owned_set_instances SET ${fields.map(field => `${field}=?`).join(',')} WHERE id=?`).run(...fields.map(field => updated[field]), req.params.instanceId);
  res.json({ ...instance, ...updated });
});
app.delete('/api/owned-sets/:instanceId', (req, res) => { db.prepare('DELETE FROM owned_set_instances WHERE id=?').run(req.params.instanceId); res.status(204).end(); });
app.patch('/api/sets/:setNum', (req, res) => {
  const current = db.prepare('SELECT * FROM sets WHERE set_num=?').get(req.params.setNum);
  if (!current) return res.status(404).json({ error: 'Set not found' });
  const quantity = req.body.owned_quantity === undefined ? current.owned_quantity : Math.max(0, Number(req.body.owned_quantity) || 0);
  const notes = req.body.notes === undefined ? current.notes : String(req.body.notes);
  db.prepare('UPDATE sets SET owned_quantity=?, notes=? WHERE set_num=?').run(quantity, notes, req.params.setNum);
  db.prepare('UPDATE inventories SET owned_quantity=MIN(owned_quantity, quantity * ?) WHERE set_num=?').run(quantity, req.params.setNum);
  res.json(db.prepare('SELECT * FROM sets WHERE set_num=?').get(req.params.setNum));
});
app.get('/api/sets/:setNum/parts', (req, res) => res.json(db.prepare(`
  SELECT i.element_id, i.quantity, i.owned_quantity AS set_owned_quantity, i.condition, i.notes, i.is_spare, p.name, p.design_id, p.color_name,
    COALESCE((SELECT SUM(osp.owned_quantity) FROM owned_set_parts osp WHERE osp.element_id=i.element_id), 0) AS total_owned
  FROM inventories i JOIN parts p ON p.element_id=i.element_id
  WHERE i.set_num=? ORDER BY i.is_spare, p.name
`).all(req.params.setNum)));
app.get('/api/owned-sets/:instanceId/parts', (req, res) => res.json(db.prepare(`
  SELECT osp.element_id,osp.quantity,osp.owned_quantity AS set_owned_quantity,osp.condition,osp.notes,osp.is_spare,p.name,p.design_id,p.color_name,
    COALESCE((SELECT SUM(all_parts.owned_quantity) FROM owned_set_parts all_parts WHERE all_parts.element_id=osp.element_id),0) AS total_owned
  FROM owned_set_parts osp JOIN parts p ON p.element_id=osp.element_id
  WHERE osp.owned_set_id=? ORDER BY osp.is_spare,p.name
`).all(req.params.instanceId)));
app.get('/api/wishlist', (_, res) => res.json(db.prepare(`SELECT s.* FROM wishlist w JOIN sets s ON s.set_num=w.set_num ORDER BY w.added_at DESC`).all()));
app.get('/api/wishlist/summary', (_, res) => res.json(db.prepare(`
  SELECT COUNT(DISTINCT i.element_id) AS unique_parts, COALESCE(SUM(i.quantity),0) AS total_parts
  FROM wishlist w JOIN inventories i ON i.set_num=w.set_num
  WHERE i.is_spare=0
`).get()));
app.delete('/api/wishlist/:setNum', (req, res) => { db.prepare('DELETE FROM wishlist WHERE set_num=?').run(req.params.setNum); res.status(204).end(); });

app.get('/api/inventory', (req, res) => {
  const group = req.query.group === 'design' ? 'design_id' : 'element_id';
  const rows = db.prepare(`SELECT p.${group} AS key, MIN(p.element_id) AS element_id, MIN(p.name) AS name, MIN(p.design_id) AS design_id, MIN(p.base_id) AS base_id, MIN(p.color_name) AS color_name, SUM(osp.owned_quantity) AS quantity
    FROM owned_set_parts osp JOIN parts p ON p.element_id=osp.element_id GROUP BY p.${group} ORDER BY quantity DESC`).all();
  res.json(rows);
});
app.get('/api/inventory/:elementId/breakdown', (req, res) => res.json(db.prepare(`
  SELECT osi.id AS owned_set_id,s.set_num,s.name,s.image_url,1 AS owned_quantity,
    SUM(osp.quantity) AS quantity,SUM(osp.owned_quantity) AS total,
    SUM(CASE WHEN osp.is_spare=0 THEN osp.quantity ELSE 0 END) AS standard_quantity,
    SUM(CASE WHEN osp.is_spare=0 THEN osp.owned_quantity ELSE 0 END) AS standard_total,
    SUM(CASE WHEN osp.is_spare=1 THEN osp.quantity ELSE 0 END) AS spare_quantity,
    SUM(CASE WHEN osp.is_spare=1 THEN osp.owned_quantity ELSE 0 END) AS spare_total,
    CASE WHEN SUM(CASE WHEN osp.is_spare=0 AND osp.condition IN ('missing','broken') THEN 1 ELSE 0 END)>0 THEN 'missing' ELSE 'complete' END AS condition,
    SUM(CASE WHEN osp.is_spare=0 THEN MAX(0,osp.quantity-osp.owned_quantity) ELSE 0 END) AS missing_quantity
  FROM owned_set_parts osp
  JOIN owned_set_instances osi ON osi.id=osp.owned_set_id
  JOIN sets s ON s.set_num=osi.set_num
  WHERE osp.element_id=?
  GROUP BY osi.id,s.set_num,s.name,s.image_url
`).all(req.params.elementId)));
app.patch('/api/owned-sets/:instanceId/parts/:elementId', (req, res) => {
  const part = db.prepare('SELECT * FROM owned_set_parts WHERE owned_set_id=? AND element_id=? AND is_spare=0').get(req.params.instanceId, req.params.elementId);
  if (!part) return res.status(404).json({ error: 'Part not found in this owned set' });
  const ownedQuantity = req.body.owned_quantity === undefined ? part.owned_quantity : Math.min(part.quantity, Math.max(0, Number(req.body.owned_quantity) || 0));
  const condition = ['complete', 'missing', 'broken'].includes(req.body.condition) ? req.body.condition : part.condition;
  const notes = req.body.notes === undefined ? part.notes : String(req.body.notes);
  db.prepare('UPDATE owned_set_parts SET owned_quantity=?,condition=?,notes=? WHERE id=?').run(ownedQuantity, condition, notes, part.id);
  res.json({ element_id: part.element_id, quantity: part.quantity, set_owned_quantity: ownedQuantity, condition, notes, total_owned: db.prepare('SELECT COALESCE(SUM(owned_quantity),0) AS total FROM owned_set_parts WHERE element_id=?').get(part.element_id).total });
});
app.patch('/api/sets/:setNum/parts/:elementId', (req, res) => {
  const item = db.prepare('SELECT i.*,s.owned_quantity AS set_quantity FROM inventories i JOIN sets s ON s.set_num=i.set_num WHERE i.set_num=? AND i.element_id=? AND i.is_spare=0').get(req.params.setNum, req.params.elementId);
  if (!item) return res.status(404).json({ error: 'Part not found in this owned set' });
  const maximum = item.quantity * item.set_quantity;
  const ownedQuantity = req.body.owned_quantity === undefined ? item.owned_quantity : Math.min(maximum, Math.max(0, Number(req.body.owned_quantity) || 0));
  const condition = ['complete', 'missing', 'broken'].includes(req.body.condition) ? req.body.condition : item.condition;
  const notes = req.body.notes === undefined ? item.notes : String(req.body.notes);
  db.prepare('UPDATE inventories SET owned_quantity=?,condition=?,notes=? WHERE set_num=? AND element_id=? AND is_spare=0').run(ownedQuantity, condition, notes, req.params.setNum, req.params.elementId);
  const updated = db.prepare('SELECT element_id,quantity,owned_quantity AS set_owned_quantity,condition,notes FROM inventories WHERE set_num=? AND element_id=? AND is_spare=0').get(req.params.setNum, req.params.elementId);
  updated.total_owned = db.prepare('SELECT COALESCE(SUM(i.owned_quantity),0) AS total FROM inventories i JOIN sets s ON s.set_num=i.set_num WHERE i.element_id=? AND s.owned_quantity>0').get(req.params.elementId).total;
  res.json(updated);
});
app.patch('/api/parts/:elementId/normalization', (req, res) => {
  const { base_id, is_mold_specific_protected } = req.body;
  db.prepare('UPDATE parts SET base_id=COALESCE(?,base_id),is_mold_specific_protected=COALESCE(?,is_mold_specific_protected) WHERE element_id=?').run(base_id, is_mold_specific_protected === undefined ? null : Number(Boolean(is_mold_specific_protected)), req.params.elementId);
  res.json(db.prepare('SELECT * FROM parts WHERE element_id=?').get(req.params.elementId));
});

function completeness(setNum) {
  const needed = db.prepare(`SELECT p.*,SUM(i.quantity) quantity FROM inventories i JOIN parts p ON p.element_id=i.element_id WHERE i.set_num=? AND i.is_spare=0 GROUP BY i.element_id`).all(setNum);
  const owned = db.prepare(`SELECT p.*,SUM(osp.owned_quantity) quantity FROM owned_set_parts osp JOIN parts p ON p.element_id=osp.element_id GROUP BY osp.element_id`).all();
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
