// Footer artwork: the house silhouette from the client's brand files, black → night, white windows → warm lamp light.
import sharp from 'sharp';
const src = 'raw/brand/Silouette_Bongsiel.png';
const { data, info } = await sharp(src).extract({ left: 0, top: 0, width: 935, height: 379 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const dark = [14, 15, 10], warm = [233, 184, 119];
for (let i = 0; i < data.length; i += 4) {
  const a = data[i + 3];
  if (!a) continue;
  const l = (data[i] + data[i + 1] + data[i + 2]) / 765;
  const t = Math.min(1, Math.max(0, (l - 0.25) / 0.6));
  for (let c = 0; c < 3; c++) data[i + c] = Math.round(dark[c] + (warm[c] - dark[c]) * t);
}
await sharp(data, { raw: info }).resize({ width: 1870, kernel: 'lanczos3' }).webp({ quality: 82, alphaQuality: 90 }).toFile('public/img/haus-nacht.webp');
await sharp(data, { raw: info }).webp({ quality: 80, alphaQuality: 85 }).toFile('public/img/haus-nacht-935.webp');
console.log('ok');
