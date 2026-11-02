// Resolves every Unsplash photo id used by the site (data/photos.json + data/gifts.json)
// through the official Unsplash API and writes data/photo-urls.json with the CDN url
// (images.unsplash.com, meant to be hotlinked) and the photographer credit for each one.
//
//   UNSPLASH_ACCESS_KEY=xxxx npm run photos
//
// Get a free key at https://unsplash.com/oauth/applications (New Application → Access Key).
// Commit the generated data/photo-urls.json and the key is no longer needed on deploys.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { loadSitePhotos } from '../lib/catalog.js';

const root = new URL('../', import.meta.url);
const outFile = new URL('data/photo-urls.json', root);
const key = process.env.UNSPLASH_ACCESS_KEY;

const { items } = JSON.parse(readFileSync(new URL('data/gifts.json', root), 'utf8'));
const ids = [...new Set([...Object.values(loadSitePhotos()), ...items.map((i) => i.unsplash).filter(Boolean)])];
const existing = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
const missing = ids.filter((id) => !existing[id]);

if (!missing.length) {
  console.log(`All ${ids.length} photos already resolved in data/photo-urls.json.`);
  process.exit(0);
}
if (!key) {
  console.log(`${missing.length} photo(s) not resolved yet. Set UNSPLASH_ACCESS_KEY to fetch them (the site shows placeholders until then).`);
  process.exit(0);
}

let failed = 0;
for (const id of missing) {
  try {
    const res = await fetch(`https://api.unsplash.com/photos/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const photo = await res.json();
    existing[id] = {
      url: photo.urls.raw,
      color: photo.color,
      author: photo.user?.name,
      authorUrl: photo.user?.links?.html,
      page: photo.links?.html,
    };
    console.log(`✓ ${id} — ${photo.user?.name}`);
  } catch (err) {
    failed++;
    console.warn(`✗ ${id}: ${err.message}`);
  }
}
writeFileSync(outFile, JSON.stringify(existing, null, 2) + '\n');
console.log(`${ids.length - failed} of ${ids.length} photos resolved → data/photo-urls.json`);
