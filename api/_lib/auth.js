const crypto = require('node:crypto');

const COOKIE_NAME = 'whimsy_admin';
const SESSION_SECONDS = 60 * 60 * 12;

function b64url(value) { return Buffer.from(value).toString('base64url'); }
function sign(value) {
  const secret = process.env.WHIMSY_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('WHIMSY_SESSION_SECRET is not configured securely.');
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}
function createSession() {
  const payload = b64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }));
  return `${payload}.${sign(payload)}`;
}
function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}
function isAuthenticated(request) {
  try {
    const token = parseCookies(request)[COOKIE_NAME];
    if (!token) return false;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;
    const expected = sign(payload);
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(data.exp) && data.exp > Date.now() / 1000;
  } catch { return false; }
}
function sessionCookie(token, request) {
  const secure = process.env.VERCEL === '1' || request.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}
function clearCookie(request) {
  const secure = process.env.VERCEL === '1' || request.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}
function verifyPassphrase(passphrase) {
  const encoded = process.env.WHIMSY_ADMIN_KEY_HASH || '';
  const [scheme, costText, saltText, hashText] = encoded.split('$');
  if (scheme !== 'scrypt' || !costText || !saltText || !hashText || typeof passphrase !== 'string' || passphrase.length > 256) return false;
  const cost = Number(costText);
  if (!Number.isInteger(cost) || cost < 16384 || cost > 131072) return false;
  const expected = Buffer.from(hashText, 'base64url');
  const actual = crypto.scryptSync(passphrase, Buffer.from(saltText, 'base64url'), expected.length, { N: cost, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { createSession, isAuthenticated, sessionCookie, clearCookie, verifyPassphrase };
