function json(response, status, body, headers = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  Object.entries(headers).forEach(([key, value]) => response.setHeader(key, value));
  response.end(JSON.stringify(body));
}

async function body(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return request.body ? JSON.parse(request.body) : {};
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 24_000) throw new Error('Request is too large.');
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

function requireJson(request) {
  return String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json');
}

function requireSameOrigin(request) {
  const origin = request.headers.origin;
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

function methodNotAllowed(response, allowed) {
  response.setHeader('Allow', allowed.join(', '));
  return json(response, 405, { error: 'Method not allowed.' });
}

module.exports = { json, body, requireJson, requireSameOrigin, methodNotAllowed };
