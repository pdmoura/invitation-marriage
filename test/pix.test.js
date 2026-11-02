import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPixPayload, crc16, sanitize } from '../lib/pix.js';

test('crc16 matches the CCITT-FALSE check value', () => {
  assert.equal(crc16('123456789'), '29B1');
});

test('reproduces the static BR Code example from the Banco Central manual', () => {
  const payload = buildPixPayload({
    key: '123e4567-e12b-12d1-a456-426655440000',
    name: 'Fulano de Tal',
    city: 'BRASILIA',
  });
  assert.equal(
    payload,
    '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
  );
});

test('includes the amount and txid and keeps a valid CRC', () => {
  const payload = buildPixPayload({
    key: 'casal@example.com',
    name: 'João & Ana',
    city: 'São Paulo',
    amount: 2000,
    txid: 'PRESENTE-AB12',
  });
  assert.match(payload, /54072000\.00/);
  assert.match(payload, /5908Joao Ana/);
  assert.match(payload, /6009Sao Paulo/);
  assert.match(payload, /0512PRESENTEAB12/);
  const body = payload.slice(0, -4);
  assert.equal(payload.slice(-4), crc16(body));
});

test('sanitize strips accents and unsupported characters', () => {
  assert.equal(sanitize('Conceição & Zé!', 25), 'Conceicao Ze');
  assert.equal(sanitize('Florianópolis do Sul', 15), 'Florianopolis d');
});

test('rejects invalid amounts', () => {
  assert.throws(() => buildPixPayload({ key: 'k', name: 'A', city: 'B', amount: -5 }));
});
