// Contact sheet of screenshots: node tools/sheet.mjs <prefix> <out.jpg> [cols] [cellWidth]
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import path from 'node:path';
const [prefix, out, cols = '3', cw = '480'] = process.argv.slice(2);
const dir = path.dirname(prefix), base = path.basename(prefix);
const files = readdirSync(dir).filter((f) => f.startsWith(base) && f.endsWith('.png')).sort().map((f) => path.join(dir, f));
const C = Number(cols), W = Number(cw);
const metas = await Promise.all(files.map((f) => sharp(f).metadata()));
const H = Math.round((W * metas[0].height) / metas[0].width);
const comp = [];
for (let i = 0; i < files.length; i++) comp.push({ input: await sharp(files[i]).resize(W, H).toBuffer(), left: (i % C) * (W + 6), top: Math.floor(i / C) * (H + 6) });
await sharp({ create: { width: C * (W + 6), height: Math.ceil(files.length / C) * (H + 6), channels: 3, background: '#f0f' } }).composite(comp).jpeg({ quality: 80 }).toFile(out);
console.log(out, files.length);
