import express from 'express';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import QRCode from 'qrcode';
import Stripe from 'stripe';
import { buildPixPayload } from './lib/pix.js';

const catalog = JSON.parse(readFileSync(new URL('./data/gifts.json', import.meta.url), 'utf8'));
const itemsById = new Map(catalog.items.map((item) => [item.id, item]));

const {
  PORT = 3000,
  PUBLIC_URL,
  STRIPE_SECRET_KEY,
  STRIPE_ENABLE_PIX,
  STRIPE_CARD_INSTALLMENTS,
  PIX_KEY,
  PIX_RECEIVER_NAME,
  PIX_CITY,
} = process.env;

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
const pixEnabled = Boolean(PIX_KEY && PIX_RECEIVER_NAME && PIX_CITY);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(new URL('./public', import.meta.url).pathname, { extensions: ['html'] }));

class BadRequest extends Error {}

// Totals are always computed on the server from the catalog, never trusted from the browser.
function priceCart(body) {
  const lines = [];
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length > 50) throw new BadRequest('Carrinho grande demais.');

  for (const entry of items) {
    const item = itemsById.get(entry?.id);
    if (!item) throw new BadRequest('Presente não encontrado.');
    const qty = Number.parseInt(entry.qty, 10);
    const maxQty = item.repeatable ? 20 : 5;
    if (!Number.isInteger(qty) || qty < 1 || qty > maxQty) throw new BadRequest('Quantidade inválida.');
    lines.push({ title: item.title, unitAmount: item.price, qty });
  }

  if (body?.customAmount !== undefined && body.customAmount !== null && body.customAmount !== '') {
    const value = Math.round(Number(body.customAmount) * 100) / 100;
    const { min, max } = catalog.customAmount;
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new BadRequest(`Valor livre deve ficar entre R$ ${min} e R$ ${max}.`);
    }
    lines.push({ title: 'Presente com valor livre', unitAmount: value, qty: 1 });
  }

  if (lines.length === 0) throw new BadRequest('Escolha pelo menos um presente.');
  const total = Math.round(lines.reduce((sum, l) => sum + l.unitAmount * l.qty, 0) * 100) / 100;
  return { lines, total };
}

function cleanText(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

app.get('/api/gifts', (_req, res) => {
  res.json({
    ...catalog,
    payments: { pix: pixEnabled, card: Boolean(stripe), stripePix: Boolean(stripe && STRIPE_ENABLE_PIX === 'true') },
  });
});

app.post('/api/pix', async (req, res, next) => {
  try {
    if (!pixEnabled) return res.status(503).json({ error: 'Pix ainda não foi configurado pelos noivos.' });
    const { total } = priceCart(req.body);
    const txid = 'PRESENTE' + randomBytes(4).toString('hex').toUpperCase();
    const payload = buildPixPayload({ key: PIX_KEY, name: PIX_RECEIVER_NAME, city: PIX_CITY, amount: total, txid });
    const qrSvg = await QRCode.toString(payload, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#2b2a26', light: '#ffffff' } });
    res.json({ total, payload, qrSvg, txid, receiver: PIX_RECEIVER_NAME, key: PIX_KEY });
  } catch (err) {
    next(err);
  }
});

app.post('/api/checkout', async (req, res, next) => {
  try {
    if (!stripe) return res.status(503).json({ error: 'Pagamento com cartão ainda não foi configurado.' });
    const { lines, total } = priceCart(req.body);
    const guestName = cleanText(req.body?.name, 80);
    const message = cleanText(req.body?.message, 450);
    const origin = PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

    const paymentMethodTypes = ['card'];
    if (STRIPE_ENABLE_PIX === 'true') paymentMethodTypes.push('pix');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'pt-BR',
      payment_method_types: paymentMethodTypes,
      line_items: lines.map((line) => ({
        quantity: line.qty,
        price_data: {
          currency: 'brl',
          unit_amount: Math.round(line.unitAmount * 100),
          product_data: { name: line.title },
        },
      })),
      ...(STRIPE_CARD_INSTALLMENTS === 'true' && { payment_method_options: { card: { installments: { enabled: true } } } }),
      submit_type: 'donate',
      metadata: { guest_name: guestName, message, total: total.toFixed(2) },
      payment_intent_data: {
        description: `Presente de casamento${guestName ? ` de ${guestName}` : ''}`,
        metadata: { guest_name: guestName, message },
      },
      success_url: `${origin}/obrigado?metodo=cartao&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#presentes`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof BadRequest) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Algo deu errado. Tente de novo em instantes.' });
});

app.listen(PORT, () => {
  console.log(`Wedding site on http://localhost:${PORT}`);
  console.log(`  Pix: ${pixEnabled ? 'enabled' : 'disabled (set PIX_KEY, PIX_RECEIVER_NAME, PIX_CITY)'}`);
  console.log(`  Card (Stripe): ${stripe ? 'enabled' : 'disabled (set STRIPE_SECRET_KEY)'}`);
});
