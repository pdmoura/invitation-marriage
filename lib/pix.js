// Builds a static Pix "BR Code" (EMV QR Code payload) following the
// Banco Central do Brasil "Manual de Padrões para Iniciação do Pix".
// The resulting string can be rendered as a QR code or pasted as
// "Pix copia e cola" in any Brazilian banking app.

const GUI = 'br.gov.bcb.pix';

function tlv(id, value) {
  const v = String(value);
  if (v.length > 99) throw new Error(`Pix field ${id} is too long (${v.length} > 99)`);
  return id + String(v.length).padStart(2, '0') + v;
}

// BR Code only accepts a restricted ASCII set in name/city/txid fields.
export function sanitize(text, maxLength) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .\-@]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// CRC16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as required by the spec.
export function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * @param {object} opts
 * @param {string} opts.key      Pix key (CPF/CNPJ digits, e-mail, +55 phone or random EVP key)
 * @param {string} opts.name     Receiver name (max 25 chars, accents stripped)
 * @param {string} opts.city     Receiver city (max 15 chars, accents stripped)
 * @param {number} [opts.amount] Amount in BRL (e.g. 150.5). Omit to let the payer type it.
 * @param {string} [opts.txid]   Reference shown on the bank statement (max 25 alphanumerics)
 */
export function buildPixPayload({ key, name, city, amount, txid }) {
  if (!key) throw new Error('Pix key is required');
  const merchantName = sanitize(name, 25);
  const merchantCity = sanitize(city, 15);
  if (!merchantName || !merchantCity) throw new Error('Pix receiver name and city are required');

  const reference = txid ? String(txid).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***' : '***';

  let payload =
    tlv('00', '01') +
    tlv('26', tlv('00', GUI) + tlv('01', String(key).trim())) +
    tlv('52', '0000') +
    tlv('53', '986');

  if (amount !== undefined && amount !== null) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid Pix amount');
    payload += tlv('54', value.toFixed(2));
  }

  payload +=
    tlv('58', 'BR') +
    tlv('59', merchantName) +
    tlv('60', merchantCity) +
    tlv('62', tlv('05', reference)) +
    '6304';

  return payload + crc16(payload);
}
