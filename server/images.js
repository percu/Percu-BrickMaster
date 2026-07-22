import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('local_storage');
const originals = path.join(root, 'original');
const thumbs = path.join(root, 'thumbs');
fs.mkdirSync(originals, { recursive: true }); fs.mkdirSync(thumbs, { recursive: true });
const safeId = (id) => String(id).replace(/[^a-zA-Z0-9._-]/g, '_');

export function imagePath(elementId, thumb = false) { return path.join(thumb ? thumbs : originals, `${safeId(elementId)}${thumb ? '_thumb' : ''}.jpg`); }
export async function cacheImage(elementId, sourceUrl) {
  const original = imagePath(elementId);
  if (fs.existsSync(original)) return original;
  if (!sourceUrl) return null;
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Could not download image (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await sharp(bytes).jpeg({ quality: 90 }).toFile(original);
  await sharp(original).resize(100, 100, { fit: 'contain', background: '#f5f3ee' }).jpeg({ quality: 80 }).toFile(imagePath(elementId, true));
  return original;
}
