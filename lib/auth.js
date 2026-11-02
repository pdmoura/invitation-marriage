import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'wedding_admin';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const sha256 = (value) => createHash('sha256').update(String(value)).digest();

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function createAuth({ password, secret, secure }) {
  const key = sha256(`${secret || ''}::${password || ''}`);
  const sign = (payload) => createHmac('sha256', key).update(payload).digest('base64url');

  // Simple in-memory brute-force protection for the login endpoint.
  const attempts = new Map();

  return {
    enabled: Boolean(password),

    checkPassword(input, ip) {
      const now = Date.now();
      const entry = attempts.get(ip) || { count: 0, until: 0 };
      if (entry.until > now) return { ok: false, locked: true };
      const ok = Boolean(password) && timingSafeEqual(sha256(input ?? ''), sha256(password));
      if (ok) attempts.delete(ip);
      else {
        entry.count += 1;
        if (entry.count >= 8) { entry.count = 0; entry.until = now + 15 * 60 * 1000; }
        attempts.set(ip, entry);
      }
      return { ok, locked: false };
    },

    issueCookie(res) {
      const expires = Date.now() + TTL_MS;
      const value = `${expires}.${sign(String(expires))}`;
      res.cookie(COOKIE, value, { httpOnly: true, sameSite: 'strict', secure, maxAge: TTL_MS, path: '/' });
    },

    clearCookie(res) {
      res.clearCookie(COOKIE, { path: '/' });
    },

    isAdmin(req) {
      if (!password) return false;
      const value = parseCookies(req.headers.cookie)[COOKIE];
      if (!value) return false;
      const [expires, sig] = value.split('.');
      if (!expires || !sig || Number(expires) < Date.now()) return false;
      return safeEqual(sig, sign(expires));
    },
  };
}
