// Real photos of the house → public/img/<name>-<width>.webp (never upscaled). Re-run after adding photos.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
const M = 'raw/media/';
const photos = {
  'deich-schafe': '2.jpeg',
  'kanal-abend': '1.jpeg',
  'gaststube-abend': 'WhatsApp-Image-2024-12-02-at-11.43.53.jpeg',
  'eingang-nacht': 'WhatsApp-Image-2024-12-02-at-11.43.5.jpeg',
  'gaststube-panorama': 'local/rundgang-gaststube.jpg',
  'teich-boot': '32.jpeg',
  'reetdachhaus': '513222182.jpg',
  'tisch-kerze': 'WhatsApp-Image-2024-12-02-at-11.43.jpeg',
  'bar': 'WhatsApp-Image-2024-12-02-at-11.4.jpeg',
  'kaminecke': 'WhatsApp-Image-2024-12-02-at-11.43.51.jpeg',
  'saal': 'WhatsApp-Image-2024-11-14-at-08.44.59.jpeg',
  'saal-tafel': 'WhatsApp-Image-2024-12-02-at-11.43.55-1.jpeg',
  'schild': '28.jpeg',
  'lammhaxe': 'WhatsApp-Image-2024-12-02-at-11.43.54.jpeg',
  'zimmer-doppel': 'Zimmer02.jpeg',
  'zimmer-einzel': 'Zimmer03.jpeg',
  'zimmer-sessel': 'Zimmer01.jpeg',
  'fewo-wohnen': '513222184.jpg',
  'tisch-blume': 'WhatsApp-Image-2024-12-02-at-11.43.56.jpeg',
  'gaststube-tag': 'WhatsApp-Image-2025-03-28-at-11.29.47.jpeg',
  'koch-boris': 'local/kuechenchef-boris-schulte-in-den-baeumen.jpg',
  'teich-lounge': '27.jpeg',
};
const widths = [640, 1024, 1600, 2000];
mkdirSync('public/img', { recursive: true });
const out = {};
for (const [name, file] of Object.entries(photos)) {
  const img = sharp(M + file).rotate();
  const meta = await img.metadata();
  const w0 = meta.autoOrient?.width ?? meta.width;
  const h0 = meta.autoOrient?.height ?? meta.height;
  const ws = widths.filter((w) => w < w0);
  ws.push(Math.min(w0, 2000));
  const set = [...new Set(ws)].sort((a, b) => a - b);
  for (const w of set) await sharp(M + file).rotate().resize({ width: w }).webp({ quality: 74 }).toFile(`public/img/${name}-${w}.webp`);
  out[name] = { w: w0, h: h0, widths: set };
}
writeFileSync('src/data/photos.json', JSON.stringify(out, null, 1));
console.log(Object.keys(out).length, 'photos');
