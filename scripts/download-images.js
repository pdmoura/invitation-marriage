// Downloads each gift photo from Unsplash into public/img/gifts/<gift-id>.jpg so the
// site serves its own copies. Run with `npm run images` (also safe to run on every deploy).
// Photos are free to use under the Unsplash License: https://unsplash.com/license
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { unsplashImageUrl } from '../lib/catalog.js';

const root = new URL('../', import.meta.url);
const outDir = new URL('public/img/gifts/', root);
mkdirSync(outDir, { recursive: true });

const { items } = JSON.parse(readFileSync(new URL('data/gifts.json', root), 'utf8'));
const force = process.argv.includes('--force');
let ok = 0;
let failed = 0;

for (const item of items) {
  if (!item.unsplash) continue;
  const target = new URL(`${item.id}.jpg`, outDir);
  if (existsSync(target) && !force) { ok++; continue; }
  try {
    const res = await fetch(unsplashImageUrl(item.unsplash, 800), { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!String(res.headers.get('content-type')).startsWith('image/')) throw new Error('not an image');
    writeFileSync(target, Buffer.from(await res.arrayBuffer()));
    ok++;
    console.log(`✓ ${item.id}`);
  } catch (err) {
    failed++;
    console.warn(`✗ ${item.id} (${item.unsplash}): ${err.message}`);
  }
}

console.log(`${ok} images ready, ${failed} failed${failed ? ' (the site falls back to the Unsplash URL or the emoji)' : ''}.`);
