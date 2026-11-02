import Stripe from 'stripe';
import { openDb } from './lib/db.js';
import { createApp } from './lib/app.js';

const env = process.env;
const port = env.PORT || 3000;

const db = await openDb({
  databaseUrl: env.DATABASE_URL,
  sqliteFile: env.SQLITE_FILE || new URL('./data/wedding.db', import.meta.url).pathname,
});
const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
const app = createApp({ db, env, stripe });

app.listen(port, () => {
  const pix = env.PIX_KEY && env.PIX_RECEIVER_NAME && env.PIX_CITY;
  console.log(`Wedding site on http://localhost:${port}  (admin: /admin)`);
  console.log(`  Database: ${db.kind}`);
  console.log(`  Pix: ${pix ? 'enabled' : 'disabled (set PIX_KEY, PIX_RECEIVER_NAME, PIX_CITY)'}`);
  console.log(`  Card (Stripe): ${stripe ? 'enabled' : 'disabled (set STRIPE_SECRET_KEY)'}`);
  console.log(`  Admin panel: ${env.ADMIN_PASSWORD ? 'enabled' : 'disabled (set ADMIN_PASSWORD)'}`);
});
