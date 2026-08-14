const { json, methodNotAllowed, requireSameOrigin } = require('../_lib/http');
const { clearCookie } = require('../_lib/auth');

module.exports = function handler(request, response) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  if (!requireSameOrigin(request)) return json(response, 403, { error: 'Request origin was rejected.' });
  response.setHeader('Set-Cookie', clearCookie(request));
  return json(response, 200, { authenticated: false });
};
