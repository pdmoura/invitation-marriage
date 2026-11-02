// Downloads every photo (site photos from data/photos.json + gift photos from data/gifts.json)
// from Unsplash into public/img/, so the site serves its own copies.
// Run with `npm run images` (runs automatically on deploy via `npm run build`). Add --force to re-download.
// Photos are free to use under the Unsplash License: https://unsplash.com/license
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { unsplashImageUrl, loadSitePhotos } from '../lib/catalog.js';

const root = new URL('../', import.meta.url);
const force = process.argv.includes('--force');
const { items } = JSON.parse(readFileSync(new URL('data/gifts.json', root), 'utf8'));

const jobs = [
  ...Object.entries(loadSitePhotos()).map(([name, id]) => ({ folder: 'site', name, id, width: 2000 })),
  ...items.filter((i) => i.unsplash).map((i) => ({ folder: 'gifts', name: i.id, id: i.unsplash, width: 900 })),
];

let ok = 0;
let failed = 0;
for (const job of jobs) {
  const dir = new URL(`public/img/${job.folder}/`, root);
  mkdirSync(dir, { recursive: true });
  const target = new URL(`${job.name}.jpg`, dir);
  if (existsSync(target) && !force) { ok++; continue; }
  try {
    // Resolve the download link to the image CDN URL, then ask the CDN for a resized, compressed JPEG.
    const head = await fetch(unsplashImageUrl(job.id, job.width), { redirect: 'manual' });
    const location = head.headers.get('location');
    if (!location) throw new Error(`HTTP ${head.status}`);
    const url = new URL(location);
    for (const [k, v] of Object.entries({ w: job.width, q: 78, fm: 'jpg', fit: 'max' })) url.searchParams.set(k, v);
    url.searchParams.delete('dl');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!String(res.headers.get('content-type')).startsWith('image/')) throw new Error('not an image');
    writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    ok++;
    console.log(`✓ ${job.folder}/${job.name}`);
  } catch (err) {
    failed++;
    console.warn(`✗ ${job.folder}/${job.name} (${job.id}): ${err.message}`);
  }
}
console.log(`${ok} photos ready, ${failed} failed${failed ? ' (those are served straight from Unsplash instead)' : ''}.`);
