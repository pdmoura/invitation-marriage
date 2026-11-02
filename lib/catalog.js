import { existsSync, readFileSync } from 'node:fs';

export class BadRequest extends Error {}

const root = new URL('../', import.meta.url);

export function unsplashImageUrl(photoId, width = 640) {
  return `https://unsplash.com/photos/${photoId}/download?w=${width}`;
}

export function loadCatalog() {
  const catalog = JSON.parse(readFileSync(new URL('data/gifts.json', root), 'utf8'));
  for (const item of catalog.items) {
    // Prefer a local copy (created by `npm run images`), fall back to Unsplash, then to the emoji.
    const local = `img/gifts/${item.id}.jpg`;
    if (existsSync(new URL(`public/${local}`, root))) item.image = `/${local}`;
    else if (item.unsplash) item.image = unsplashImageUrl(item.unsplash);
  }
  catalog.itemsById = new Map(catalog.items.map((item) => [item.id, item]));
  return catalog;
}

// Totals are always computed on the server from the catalog, never trusted from the browser.
export function priceCart(catalog, body) {
  const lines = [];
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length > 50) throw new BadRequest('Carrinho grande demais.');

  for (const entry of items) {
    const item = catalog.itemsById.get(entry?.id);
    if (!item) throw new BadRequest('Presente não encontrado.');
    const qty = Number.parseInt(entry.qty, 10);
    const maxQty = item.repeatable ? 20 : 5;
    if (!Number.isInteger(qty) || qty < 1 || qty > maxQty) throw new BadRequest('Quantidade inválida.');
    lines.push({ id: item.id, title: item.title, unitAmount: item.price, qty });
  }

  if (body?.customAmount !== undefined && body.customAmount !== null && body.customAmount !== '') {
    const value = Math.round(Number(body.customAmount) * 100) / 100;
    const { min, max } = catalog.customAmount;
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new BadRequest(`Valor livre deve ficar entre R$ ${min} e R$ ${max}.`);
    }
    lines.push({ id: 'valor-livre', title: 'Presente com valor livre', unitAmount: value, qty: 1 });
  }

  if (lines.length === 0) throw new BadRequest('Escolha pelo menos um presente.');
  const total = Math.round(lines.reduce((sum, l) => sum + l.unitAmount * l.qty, 0) * 100) / 100;
  return { lines, total, totalCents: Math.round(total * 100) };
}

// Short human-readable summary stored with each gift, e.g. "2× Frigideira…, 1× Cota da lua de mel".
export function describeLines(lines) {
  return lines.map((l) => `${l.qty}× ${l.title}`).join(', ').slice(0, 480);
}
