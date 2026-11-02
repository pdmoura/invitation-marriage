import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../lib/db.js';
import { createApp } from '../lib/app.js';

let server;
let base;
let cookie = '';
let checkoutParams;

const fakeStripe = {
  checkout: {
    sessions: {
      async create(params) {
        checkoutParams = params;
        return { id: 'cs_test_123', url: 'https://checkout.stripe.test/cs_test_123' };
      },
      async retrieve(id) {
        return {
          id,
          payment_status: 'paid',
          amount_total: 9900,
          metadata: { guest_name: 'Tia Cláudia', message: 'Felicidades!', invite_token: checkoutParams.metadata.invite_token, items: '1× Pantalones' },
        };
      },
    },
  },
};

async function call(path, { method = 'GET', body, auth = false } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(auth && { Cookie: cookie }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, data, headers: res.headers };
}

before(async () => {
  const db = await openDb({ sqliteFile: ':memory:' });
  const app = createApp({
    db,
    stripe: fakeStripe,
    env: { ADMIN_PASSWORD: 'segredo', PIX_KEY: 'casal@example.com', PIX_RECEIVER_NAME: 'Pedro e Sara', PIX_CITY: 'Formosa' },
  });
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('gift list is served in three languages with local photos', async () => {
  const gifts = (await call('/api/gifts')).data;
  const pan = gifts.items.find((i) => i.id === 'frigideira');
  assert.equal(pan.image, '/img/gifts/frigideira.jpg');
  assert.ok(pan.title.pt && pan.title.en && pan.title.es);
  assert.equal((await fetch(`${base}${pan.image}`)).status, 200);
  assert.equal((await fetch(`${base}/img/site/hero.jpg`)).status, 200);
  assert.equal((await fetch(`${base}/vendor/lenis.min.js`)).status, 200);
});

test('admin API requires login', async () => {
  assert.equal((await call('/api/admin/summary')).status, 401);
  assert.equal((await call('/api/admin/login', { method: 'POST', body: { password: 'errada' } })).status, 401);
  const ok = await call('/api/admin/login', { method: 'POST', body: { password: 'segredo' } });
  assert.equal(ok.status, 200);
  cookie = ok.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/admin/me', { auth: true })).status, 200);
});

let invite;

test('admin creates and imports invites with personalized links', async () => {
  const created = await call('/api/admin/invites', { method: 'POST', auth: true, body: { name: 'Família Souza', seats: 4, phone: '61 99999-1111', lang: 'en' } });
  assert.equal(created.data.lang, 'en');
  assert.equal(created.data.gift_mode, 'items');
  assert.equal((await call('/api/admin/invites', { method: 'POST', auth: true, body: { name: 'X', lang: 'fr' } })).status, 400);
  assert.equal(created.status, 201);
  assert.match(created.data.token, /^[a-z0-9]{7}$/);
  assert.equal(created.data.phone, '5561999991111');

  const imported = await call('/api/admin/invites/import', {
    method: 'POST', auth: true, body: { text: 'Tio João e Tia Maria; 2; 61 98888-2222; es; simples\nLucas\tl\n;3' },
  });
  assert.equal(imported.data.created, 2);
  assert.equal(imported.data.errors.length, 1);

  const list = await call('/api/admin/invites', { auth: true });
  assert.equal(list.data.length, 3);
  invite = list.data.find((i) => i.name === 'Família Souza');
  const tio = list.data.find((i) => i.name.startsWith('Tio'));
  assert.deepEqual([tio.lang, tio.gift_mode], ['es', 'simple']);
  const tioPublic = (await call(`/api/invite/${tio.token}`)).data;
  assert.deepEqual([tioPublic.lang, tioPublic.giftMode], ['es', 'simple']);
  const switched = await call(`/api/admin/invites/${tio.id}`, { method: 'PATCH', auth: true, body: { gift_mode: 'items', lang: 'pt' } });
  assert.deepEqual([switched.data.lang, switched.data.gift_mode], ['pt', 'items']);
  assert.ok(invite.link.endsWith(`/c/${invite.token}`));
});

test('guest opens the personalized link and confirms in one tap', async () => {
  const page = await call(`/c/${invite.token}`);
  assert.equal(page.status, 200);
  assert.match(page.data, /<html/);

  const info = await call(`/api/invite/${invite.token}`);
  assert.deepEqual([info.data.name, info.data.seats, info.data.status], ['Família Souza', 4, 'pending']);
  assert.equal((await call('/api/invite/naoexiste')).status, 404);

  const bad = await call(`/api/invite/${invite.token}/rsvp`, { method: 'POST', body: { attending: 'maybe' } });
  assert.equal(bad.status, 400);

  // One tap confirms exactly the seats the couple reserved — guests can't change the number.
  const ok = await call(`/api/invite/${invite.token}/rsvp`, { method: 'POST', body: { attending: 'yes', count: 99 } });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.seats, 4);
  assert.equal((await call(`/api/invite/${invite.token}`)).data.status, 'yes');

  const summary = await call('/api/admin/summary', { auth: true });
  assert.equal(summary.data.invites.total, 3);
  assert.equal(summary.data.invites.seats, 4 + 2 + 1);
  assert.equal(summary.data.invites.confirmedPeople, 4);
  assert.equal(summary.data.invites.opened, 2); // Família Souza + Tio (fetched above)
  assert.equal(summary.data.invites.pendingSeats, 3);
});

test('pix gift is pending until the couple confirms it', async () => {
  const cart = { items: [{ id: 'frigideira', qty: 2 }], customAmount: 50, invite: invite.token, name: '' };
  const pix = await call('/api/pix', { method: 'POST', body: cart });
  assert.equal(pix.data.total, 110);
  assert.match(pix.data.payload, /^000201/);

  assert.equal((await call('/api/pix/sent', { method: 'POST', body: { ...cart, txid: 'hack' } })).status, 400);
  assert.equal((await call('/api/pix/sent', { method: 'POST', body: { ...cart, txid: pix.data.txid } })).status, 200);
  await call('/api/pix/sent', { method: 'POST', body: { ...cart, txid: pix.data.txid } }); // duplicate click is ignored

  let gifts = (await call('/api/admin/gifts', { auth: true })).data;
  assert.equal(gifts.length, 1);
  assert.equal(gifts[0].guest_name, 'Família Souza');
  assert.equal(gifts[0].status, 'pending');
  let money = (await call('/api/admin/summary', { auth: true })).data.money;
  assert.equal(money.pendingPixCents, 11000);
  assert.equal(money.receivedCents, 0);

  await call(`/api/admin/gifts/${gifts[0].id}`, { method: 'PATCH', auth: true, body: { status: 'paid' } });
  money = (await call('/api/admin/summary', { auth: true })).data.money;
  assert.equal(money.receivedCents, 11000);
  assert.equal(money.pixCents, 11000);
});

test('card checkout is priced on the server and recorded once paid', async () => {
  const res = await call('/api/checkout', {
    method: 'POST', body: { items: [{ id: 'spiderman', qty: 1 }], invite: invite.token, name: 'Tia Cláudia' },
  });
  assert.equal(res.data.url, 'https://checkout.stripe.test/cs_test_123');
  assert.equal(checkoutParams.line_items[0].price_data.unit_amount, 9900);
  assert.equal(checkoutParams.locale, 'en'); // the invite's language
  assert.equal(checkoutParams.line_items[0].price_data.product_data.name, 'Spider-Man pants for the groom');
  assert.equal(checkoutParams.line_items[0].price_data.currency, 'brl');
  assert.equal(checkoutParams.metadata.invite_token, invite.token);

  await call('/api/checkout/confirm?session_id=cs_test_123');
  await call('/api/checkout/confirm?session_id=cs_test_123'); // reload of the thank-you page doesn't duplicate

  const money = (await call('/api/admin/summary', { auth: true })).data.money;
  assert.equal(money.cardCents, 9900);
  assert.equal(money.receivedCents, 11000 + 9900);
  const list = (await call('/api/admin/invites', { auth: true })).data;
  assert.equal(list.find((i) => i.id === invite.id).gift_cents, 11000 + 9900);
});

test('manual gifts, edits and CSV export', async () => {
  const gift = await call('/api/admin/gifts', { method: 'POST', auth: true, body: { guest_name: 'Vó Lúcia', amount: '300' } });
  assert.equal(gift.status, 201);
  const edited = await call(`/api/admin/invites/${invite.id}`, { method: 'PATCH', auth: true, body: { seats: 3 } });
  assert.equal(edited.data.confirmed_count, 3); // confirmed invites always count all their seats
  const ok = await call(`/api/admin/invites/${invite.id}`, { method: 'PATCH', auth: true, body: { status: 'no' } });
  assert.equal(ok.data.confirmed_count, 0);
  const csv = await call('/api/admin/invites.csv', { auth: true });
  assert.match(csv.data, /Família Souza/);
  assert.equal((await call('/api/admin/invites.csv')).status, 401);
});
