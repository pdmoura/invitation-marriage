import { existsSync, readFileSync } from 'node:fs';

export class BadRequest extends Error {}

export const LANGS = ['pt', 'en', 'es'];
export const normalizeLang = (lang) => (LANGS.includes(lang) ? lang : 'pt');

const root = new URL('../', import.meta.url);

const CUSTOM_TITLES = { pt: 'Presente com valor livre', en: 'Gift (custom amount)', es: 'Regalo (valor libre)' };

/**
 * Loads data/gifts.json. Titles/descriptions are { pt, en, es }; `title` is kept in Portuguese
 * for the admin panel, `titles` holds every language. Photos live in public/img/gifts/<id>.jpg
 * (the card shows the emoji when a photo is missing).
 */
export function loadCatalog() {
  const catalog = JSON.parse(readFileSync(new URL('data/gifts.json', root), 'utf8'));
  for (const item of catalog.items) {
    item.titles = item.title;
    item.descriptions = item.description;
    item.title = item.titles.pt;
    item.description = item.descriptions.pt;
    if (existsSync(new URL(`public/img/gifts/${item.id}.jpg`, root))) item.image = `/img/gifts/${item.id}.jpg`;
  }
  catalog.itemsById = new Map(catalog.items.map((item) => [item.id, item]));
  return catalog;
}

// What the browser needs to render the gift list.
export function publicCatalog(catalog) {
  return {
    currency: catalog.currency,
    customAmount: catalog.customAmount,
    items: catalog.items.map((i) => ({
      id: i.id, emoji: i.emoji, price: i.price, repeatable: Boolean(i.repeatable), tag: i.tag || null,
      image: i.image || null, title: i.titles, description: i.descriptions,
    })),
  };
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
    lines.push({ id: item.id, title: item.title, titles: item.titles, unitAmount: item.price, qty });
  }

  if (body?.customAmount !== undefined && body.customAmount !== null && body.customAmount !== '') {
    const value = Math.round(Number(body.customAmount) * 100) / 100;
    const { min, max } = catalog.customAmount;
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new BadRequest(`Valor livre deve ficar entre R$ ${min} e R$ ${max}.`);
    }
    lines.push({ id: 'valor-livre', title: CUSTOM_TITLES.pt, titles: CUSTOM_TITLES, unitAmount: value, qty: 1 });
  }

  if (lines.length === 0) throw new BadRequest('Escolha pelo menos um presente.');
  const total = Math.round(lines.reduce((sum, l) => sum + l.unitAmount * l.qty, 0) * 100) / 100;
  return { lines, total, totalCents: Math.round(total * 100) };
}

// Short human-readable summary stored with each gift, e.g. "2× Frigideira…, 1× Cota da lua de mel".
export function describeLines(lines) {
  return lines.map((l) => `${l.qty}× ${l.title}`).join(', ').slice(0, 480);
}
