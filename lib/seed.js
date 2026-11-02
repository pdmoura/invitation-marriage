// Demo data for previews (enabled with SEED_DEMO=true). Creates a few invites with fixed,
// easy links like /c/joana so the site can be tried right after a deploy. Never enable in production.
import { randomUUID } from 'node:crypto';

const DEMO_INVITES = [
  ['joana', 'Joana e família', 4],
  ['tiojoao', 'Tio João e Tia Maria', 2],
  ['lucas', 'Lucas', 1],
];

export async function seedDemo(db) {
  for (const [token, name, seats] of DEMO_INVITES) {
    await db.run(
      `INSERT INTO invites (id, token, name, seats, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (token) DO NOTHING`,
      [randomUUID(), token, name, seats, new Date().toISOString()],
    );
  }
  return DEMO_INVITES.map(([token]) => `/c/${token}`);
}
