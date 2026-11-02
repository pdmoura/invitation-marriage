import express from 'express';
import { randomBytes, randomUUID, randomInt } from 'node:crypto';
import QRCode from 'qrcode';
import { buildPixPayload } from './pix.js';
import { BadRequest, describeLines, loadCatalog, loadPhotoUrls, loadSitePhotos, priceCart, sizedPhotoUrl } from './catalog.js';
import { createAuth } from './auth.js';

const PUBLIC_DIR = new URL('../public', import.meta.url).pathname;
const TOKEN_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

const now = () => new Date().toISOString();
const cleanText = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`; // Brazilian number without country code
  return digits.slice(0, 15);
}

function parseSeats(value, fallback = 1) {
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n)) return fallback;
  if (n < 1 || n > 30) throw new BadRequest('Número de lugares deve ficar entre 1 e 30.');
  return n;
}

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * @param {object} opts
 * @param {object} opts.db       storage from lib/db.js
 * @param {object} opts.env      environment-like config
 * @param {object} [opts.stripe] Stripe client (optional)
 * @param {object} [opts.photoUrls] resolved Unsplash photos (defaults to data/photo-urls.json)
 */
export function createApp({ db, env = {}, stripe = null, photoUrls = loadPhotoUrls() }) {
  const catalog = loadCatalog();
  const sitePhotos = loadSitePhotos();
  const pixEnabled = Boolean(env.PIX_KEY && env.PIX_RECEIVER_NAME && env.PIX_CITY);
  const auth = createAuth({
    password: env.ADMIN_PASSWORD,
    secret: env.SESSION_SECRET,
    secure: env.NODE_ENV === 'production',
  });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const originOf = (req) => env.PUBLIC_URL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;

  /* ---------------- data helpers ---------------- */

  async function newToken() {
    for (let attempt = 0; attempt < 10; attempt++) {
      let token = '';
      for (let i = 0; i < 7; i++) token += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
      if (!(await db.get('SELECT id FROM invites WHERE token = ?', [token]))) return token;
    }
    throw new Error('Could not generate a unique invite token');
  }

  async function createInvite({ name, seats, phone, notes }) {
    const cleanName = cleanText(name, 120);
    if (!cleanName) throw new BadRequest('Informe o nome do convite.');
    const invite = {
      id: randomUUID(),
      token: await newToken(),
      name: cleanName,
      phone: normalizePhone(phone),
      seats: parseSeats(seats),
      notes: cleanText(notes, 300) || null,
      created_at: now(),
    };
    await db.run(
      'INSERT INTO invites (id, token, name, phone, seats, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [invite.id, invite.token, invite.name, invite.phone, invite.seats, invite.notes, invite.created_at],
    );
    return invite;
  }

  const findInviteByToken = (token) =>
    typeof token === 'string' && token.length <= 20 ? db.get('SELECT * FROM invites WHERE token = ?', [token]) : null;

  async function recordStripeSession(session) {
    const paid = session.payment_status === 'paid';
    const meta = session.metadata || {};
    const invite = meta.invite_token ? await findInviteByToken(meta.invite_token) : null;
    await db.run(
      `INSERT INTO gifts (id, invite_id, guest_name, message, method, amount_cents, items, status, reference, created_at, paid_at)
       VALUES (?, ?, ?, ?, 'card', ?, ?, ?, ?, ?, ?)
       ON CONFLICT (reference) DO UPDATE SET status = excluded.status, paid_at = excluded.paid_at`,
      [
        randomUUID(),
        invite?.id ?? null,
        meta.guest_name || invite?.name || null,
        meta.message || null,
        session.amount_total ?? 0,
        meta.items || null,
        paid ? 'paid' : 'pending',
        session.id,
        now(),
        paid ? now() : null,
      ],
    );
    return { paid, guestName: meta.guest_name || invite?.name || '' };
  }

  /* ---------------- Stripe webhook (needs the raw body, so it goes before express.json) ---------------- */

  app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), asyncRoute(async (req, res) => {
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) return res.status(404).end();
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return res.status(400).send('Invalid signature');
    }
    if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
      await recordStripeSession(event.data.object);
    }
    res.json({ received: true });
  }));

  app.use(express.json({ limit: '50kb' }));

  /* ---------------- pages ---------------- */

  // Personalized invitation link: /c/<token>
  app.get('/c/:token', (_req, res) => res.sendFile('index.html', { root: PUBLIC_DIR }));
  app.get('/admin', (_req, res) => res.sendFile('admin.html', { root: PUBLIC_DIR }));
  app.use(express.static(PUBLIC_DIR, { extensions: ['html'], maxAge: '1h' }));

  // Photos: a file dropped into public/img/... wins (served by express.static above); otherwise
  // redirect to the Unsplash CDN url resolved by `npm run photos`. Unknown → 404 (page shows a placeholder).
  app.get('/img/:folder/:file', (req, res) => {
    const name = req.params.file.replace(/\.jpg$/, '');
    const id = req.params.folder === 'site' ? sitePhotos[name]
      : req.params.folder === 'gifts' ? catalog.itemsById.get(name)?.unsplash : null;
    const photo = id && photoUrls[id];
    if (!photo?.url) return res.status(404).end();
    res.set('Cache-Control', 'public, max-age=86400');
    res.redirect(302, sizedPhotoUrl(photo.url, req.params.folder === 'site' ? 1800 : 800));
  });

  // Photographer credits, required by the Unsplash API guidelines.
  app.get('/api/photo-credits', (_req, res) => {
    const seen = new Map();
    for (const p of Object.values(photoUrls)) if (p.author && !seen.has(p.author)) seen.set(p.author, p.authorUrl);
    res.json([...seen].map(([name, url]) => ({ name, url })));
  });

  /* ---------------- public API ---------------- */

  app.get('/api/gifts', (_req, res) => {
    const { itemsById, ...rest } = catalog;
    res.json({
      ...rest,
      payments: { pix: pixEnabled, card: Boolean(stripe), stripePix: Boolean(stripe && env.STRIPE_ENABLE_PIX === 'true') },
    });
  });

  app.get('/api/invite/:token', asyncRoute(async (req, res) => {
    const invite = await findInviteByToken(req.params.token);
    if (!invite) return res.status(404).json({ error: 'Convite não encontrado.' });
    if (!invite.opened_at) await db.run('UPDATE invites SET opened_at = ? WHERE id = ?', [now(), invite.id]);
    res.json({ name: invite.name, seats: invite.seats, status: invite.status });
  }));

  // One tap: the invite is for exactly `seats` people — they either all come or decline.
  app.post('/api/invite/:token/rsvp', asyncRoute(async (req, res) => {
    const invite = await findInviteByToken(req.params.token);
    if (!invite) return res.status(404).json({ error: 'Convite não encontrado.' });
    const answer = req.body?.attending;
    if (!['yes', 'no'].includes(answer)) throw new BadRequest('Resposta inválida.');
    const count = answer === 'yes' ? invite.seats : 0;
    await db.run('UPDATE invites SET status = ?, confirmed_count = ?, responded_at = ? WHERE id = ?', [answer, count, now(), invite.id]);
    res.json({ ok: true, status: answer, seats: invite.seats });
  }));

  app.post('/api/pix', asyncRoute(async (req, res) => {
    if (!pixEnabled) return res.status(503).json({ error: 'Pix ainda não foi configurado pelos noivos.' });
    const { total } = priceCart(catalog, req.body);
    const txid = 'PRESENTE' + randomBytes(4).toString('hex').toUpperCase();
    const payload = buildPixPayload({ key: env.PIX_KEY, name: env.PIX_RECEIVER_NAME, city: env.PIX_CITY, amount: total, txid });
    const qrSvg = await QRCode.toString(payload, {
      type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#2b2a26', light: '#ffffff' },
    });
    res.json({ total, payload, qrSvg, txid, receiver: env.PIX_RECEIVER_NAME, key: env.PIX_KEY });
  }));

  // Guest clicked "Já fiz o Pix": record it as pending until the couple sees it in the bank.
  app.post('/api/pix/sent', asyncRoute(async (req, res) => {
    const { lines, totalCents } = priceCart(catalog, req.body);
    const txid = cleanText(req.body?.txid, 40);
    if (!/^PRESENTE[0-9A-F]{8}$/.test(txid)) throw new BadRequest('Referência do Pix inválida.');
    const invite = await findInviteByToken(req.body?.invite);
    await db.run(
      `INSERT INTO gifts (id, invite_id, guest_name, message, method, amount_cents, items, status, reference, created_at)
       VALUES (?, ?, ?, ?, 'pix', ?, ?, 'pending', ?, ?)
       ON CONFLICT (reference) DO NOTHING`,
      [
        randomUUID(),
        invite?.id ?? null,
        cleanText(req.body?.name, 80) || invite?.name || null,
        cleanText(req.body?.message, 450) || null,
        totalCents,
        describeLines(lines),
        txid,
        now(),
      ],
    );
    res.json({ ok: true });
  }));

  app.post('/api/checkout', asyncRoute(async (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Pagamento com cartão ainda não foi configurado.' });
    const { lines, total } = priceCart(catalog, req.body);
    const invite = await findInviteByToken(req.body?.invite);
    const guestName = cleanText(req.body?.name, 80) || invite?.name || '';
    const message = cleanText(req.body?.message, 450);
    const origin = originOf(req);

    const paymentMethodTypes = ['card'];
    if (env.STRIPE_ENABLE_PIX === 'true') paymentMethodTypes.push('pix');
    const metadata = {
      guest_name: guestName,
      message,
      invite_token: invite?.token ?? '',
      items: describeLines(lines),
      total: total.toFixed(2),
    };

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
      ...(env.STRIPE_CARD_INSTALLMENTS === 'true' && { payment_method_options: { card: { installments: { enabled: true } } } }),
      submit_type: 'donate',
      metadata,
      payment_intent_data: {
        description: `Presente de casamento${guestName ? ` de ${guestName}` : ''}`,
        metadata: { guest_name: guestName, message, invite_token: metadata.invite_token },
      },
      success_url: `${origin}/obrigado?metodo=cartao&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${invite ? `c/${invite.token}` : ''}#presentes`,
    });

    res.json({ url: session.url });
  }));

  // Called by the thank-you page, so card gifts are recorded even without a webhook configured.
  app.get('/api/checkout/confirm', asyncRoute(async (req, res) => {
    const id = String(req.query.session_id || '');
    if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ error: 'Sessão inválida.' });
    const session = await stripe.checkout.sessions.retrieve(id);
    const result = await recordStripeSession(session);
    res.json(result);
  }));

  /* ---------------- admin API ---------------- */

  app.post('/api/admin/login', (req, res) => {
    if (!auth.enabled) return res.status(503).json({ error: 'Defina ADMIN_PASSWORD no servidor para usar o painel.' });
    const { ok, locked } = auth.checkPassword(req.body?.password, req.ip);
    if (locked) return res.status(429).json({ error: 'Muitas tentativas. Tente de novo em 15 minutos.' });
    if (!ok) return res.status(401).json({ error: 'Senha incorreta.' });
    auth.issueCookie(res);
    res.json({ ok: true });
  });

  app.post('/api/admin/logout', (_req, res) => {
    auth.clearCookie(res);
    res.json({ ok: true });
  });

  app.use('/api/admin', (req, res, next) => {
    if (!auth.isAdmin(req)) return res.status(401).json({ error: 'Faça login.' });
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/admin/me', (_req, res) => res.json({ ok: true }));

  app.get('/api/admin/summary', asyncRoute(async (_req, res) => {
    const invites = await db.all('SELECT seats, status, confirmed_count, opened_at FROM invites');
    const gifts = await db.all('SELECT method, amount_cents, status FROM gifts');
    const sum = (rows, pick) => rows.reduce((acc, row) => acc + Number(pick(row) || 0), 0);
    const by = (status) => invites.filter((i) => i.status === status);
    const paid = gifts.filter((g) => g.status === 'paid');
    const pendingPix = gifts.filter((g) => g.status === 'pending' && g.method === 'pix');

    res.json({
      invites: {
        total: invites.length,
        seats: sum(invites, (i) => i.seats),
        opened: invites.filter((i) => i.opened_at).length,
        confirmedInvites: by('yes').length,
        confirmedPeople: sum(by('yes'), (i) => i.confirmed_count),
        declinedInvites: by('no').length,
        declinedSeats: sum(by('no'), (i) => i.seats),
        pendingInvites: by('pending').length,
        pendingSeats: sum(by('pending'), (i) => i.seats),
      },
      money: {
        receivedCents: sum(paid, (g) => g.amount_cents),
        cardCents: sum(paid.filter((g) => g.method === 'card'), (g) => g.amount_cents),
        pixCents: sum(paid.filter((g) => g.method === 'pix'), (g) => g.amount_cents),
        manualCents: sum(paid.filter((g) => g.method === 'manual'), (g) => g.amount_cents),
        pendingPixCents: sum(pendingPix, (g) => g.amount_cents),
        pendingPixCount: pendingPix.length,
        giftsCount: paid.length,
      },
    });
  }));

  app.get('/api/admin/invites', asyncRoute(async (req, res) => {
    const invites = await db.all('SELECT * FROM invites ORDER BY created_at DESC, name');
    const totals = await db.all(
      `SELECT invite_id, SUM(amount_cents) AS cents FROM gifts WHERE status = 'paid' AND invite_id IS NOT NULL GROUP BY invite_id`,
    );
    const giftByInvite = new Map(totals.map((t) => [t.invite_id, Number(t.cents)]));
    const origin = originOf(req);
    res.json(invites.map((i) => ({ ...i, link: `${origin}/c/${i.token}`, gift_cents: giftByInvite.get(i.id) || 0 })));
  }));

  app.post('/api/admin/invites', asyncRoute(async (req, res) => {
    res.status(201).json(await createInvite(req.body || {}));
  }));

  // Bulk import: one invite per line, "Name; seats; phone" (tabs from a spreadsheet also work).
  app.post('/api/admin/invites/import', asyncRoute(async (req, res) => {
    const lines = String(req.body?.text || '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 500) throw new BadRequest('Importe no máximo 500 linhas por vez.');
    const created = [];
    const errors = [];
    for (const [idx, line] of lines.entries()) {
      const [name, seats, phone] = line.split(/\t|;/).map((p) => p.trim());
      try {
        created.push(await createInvite({ name, seats: seats || 1, phone }));
      } catch (err) {
        if (!(err instanceof BadRequest)) throw err;
        errors.push(`Linha ${idx + 1}: ${err.message}`);
      }
    }
    res.json({ created: created.length, errors });
  }));

  app.patch('/api/admin/invites/:id', asyncRoute(async (req, res) => {
    const invite = await db.get('SELECT * FROM invites WHERE id = ?', [req.params.id]);
    if (!invite) return res.status(404).json({ error: 'Convite não encontrado.' });
    const body = req.body || {};
    const next = {
      name: body.name !== undefined ? cleanText(body.name, 120) : invite.name,
      phone: body.phone !== undefined ? normalizePhone(body.phone) : invite.phone,
      seats: body.seats !== undefined ? parseSeats(body.seats) : invite.seats,
      notes: body.notes !== undefined ? cleanText(body.notes, 300) || null : invite.notes,
      status: body.status !== undefined ? body.status : invite.status,
    };
    if (!next.name) throw new BadRequest('Informe o nome do convite.');
    if (!['pending', 'yes', 'no'].includes(next.status)) throw new BadRequest('Status inválido.');
    next.confirmed_count = next.status === 'yes' ? next.seats : 0;
    const respondedAt = next.status !== invite.status ? (next.status === 'pending' ? null : now()) : invite.responded_at;
    await db.run(
      'UPDATE invites SET name = ?, phone = ?, seats = ?, notes = ?, status = ?, confirmed_count = ?, responded_at = ? WHERE id = ?',
      [next.name, next.phone, next.seats, next.notes, next.status, next.confirmed_count, respondedAt, invite.id],
    );
    res.json({ ...invite, ...next, responded_at: respondedAt });
  }));

  app.delete('/api/admin/invites/:id', asyncRoute(async (req, res) => {
    await db.run('UPDATE gifts SET invite_id = NULL WHERE invite_id = ?', [req.params.id]);
    const { changes } = await db.run('DELETE FROM invites WHERE id = ?', [req.params.id]);
    res.status(changes ? 204 : 404).end();
  }));

  app.get('/api/admin/invites.csv', asyncRoute(async (req, res) => {
    const rows = await db.all('SELECT * FROM invites ORDER BY name');
    const origin = originOf(req);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const statusLabel = { pending: 'Aguardando', yes: 'Confirmado', no: 'Não vai' };
    const header = ['Convite', 'Pessoas', 'Resposta', 'Confirmados', 'Telefone', 'Observações', 'Link', 'Abriu o convite', 'Respondeu em'];
    const csv = [header.map(esc).join(';')]
      .concat(rows.map((r) => [
        r.name, r.seats, statusLabel[r.status], r.confirmed_count, r.phone, r.notes,
        `${origin}/c/${r.token}`, r.opened_at ? 'Sim' : 'Não', r.responded_at,
      ].map(esc).join(';')))
      .join('\r\n');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="convidados.csv"');
    res.send('﻿' + csv);
  }));

  app.get('/api/admin/gifts', asyncRoute(async (_req, res) => {
    const gifts = await db.all(
      `SELECT g.*, i.name AS invite_name FROM gifts g LEFT JOIN invites i ON i.id = g.invite_id ORDER BY g.created_at DESC`,
    );
    res.json(gifts);
  }));

  // Manual entry: cash in an envelope, a Pix sent outside the site, etc.
  app.post('/api/admin/gifts', asyncRoute(async (req, res) => {
    const amount = Math.round(Number(req.body?.amount) * 100);
    if (!Number.isInteger(amount) || amount <= 0 || amount > 100_000_000) throw new BadRequest('Valor inválido.');
    const invite = req.body?.invite_id ? await db.get('SELECT id, name FROM invites WHERE id = ?', [req.body.invite_id]) : null;
    const gift = {
      id: randomUUID(),
      invite_id: invite?.id ?? null,
      guest_name: cleanText(req.body?.guest_name, 80) || invite?.name || null,
      message: cleanText(req.body?.message, 450) || null,
      amount_cents: amount,
      created_at: now(),
    };
    if (!gift.guest_name) throw new BadRequest('Informe quem deu o presente.');
    await db.run(
      `INSERT INTO gifts (id, invite_id, guest_name, message, method, amount_cents, items, status, reference, created_at, paid_at)
       VALUES (?, ?, ?, ?, 'manual', ?, NULL, 'paid', NULL, ?, ?)`,
      [gift.id, gift.invite_id, gift.guest_name, gift.message, gift.amount_cents, gift.created_at, gift.created_at],
    );
    res.status(201).json(gift);
  }));

  app.patch('/api/admin/gifts/:id', asyncRoute(async (req, res) => {
    const status = req.body?.status;
    if (!['pending', 'paid'].includes(status)) throw new BadRequest('Status inválido.');
    const { changes } = await db.run('UPDATE gifts SET status = ?, paid_at = ? WHERE id = ?', [
      status, status === 'paid' ? now() : null, req.params.id,
    ]);
    res.status(changes ? 200 : 404).json({ ok: Boolean(changes) });
  }));

  app.delete('/api/admin/gifts/:id', asyncRoute(async (req, res) => {
    const { changes } = await db.run('DELETE FROM gifts WHERE id = ?', [req.params.id]);
    res.status(changes ? 204 : 404).end();
  }));

  /* ---------------- errors ---------------- */

  app.use((err, _req, res, _next) => {
    if (err instanceof BadRequest) return res.status(400).json({ error: err.message });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
    console.error(err);
    res.status(500).json({ error: 'Algo deu errado. Tente de novo em instantes.' });
  });

  return app;
}
