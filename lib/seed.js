// Demo data for previews (enabled with SEED_DEMO=true). Creates a few invites with fixed,
// easy links like /c/joana so the site can be tried right after a deploy. Never enable in production.
import { randomUUID } from 'node:crypto';

const DEMO_INVITES = [
  // token, name, people, language, gift style
  ['joana', 'Joana e família', 4, 'pt', 'items'],
  ['tiojoao', 'Tio João e Tia Maria', 2, 'pt', 'simple'],
  ['john', 'John & Mary', 2, 'en', 'items'],
  ['garcia', 'Familia García', 3, 'es', 'simple'],
];

export async function seedDemo(db) {
  for (const [token, name, seats, lang, giftMode] of DEMO_INVITES) {
    await db.run(
      `INSERT INTO invites (id, token, name, seats, lang, gift_mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (token) DO NOTHING`,
      [randomUUID(), token, name, seats, lang, giftMode, new Date().toISOString()],
    );
  }
  return DEMO_INVITES.map(([token]) => `/c/${token}`);
}
