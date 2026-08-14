const { body, json, methodNotAllowed, requireJson, requireSameOrigin } = require('../_lib/http');
const { createSession, sessionCookie, verifyPassphrase } = require('../_lib/auth');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  if (!requireSameOrigin(request)) return json(response, 403, { error: 'Request origin was rejected.' });
  if (!requireJson(request)) return json(response, 415, { error: 'JSON content is required.' });
  try {
    const input = await body(request);
    if (!verifyPassphrase(input.passphrase)) {
      await new Promise(resolve => setTimeout(resolve, 350));
      return json(response, 401, { error: 'That passphrase did not work.' });
    }
    response.setHeader('Set-Cookie', sessionCookie(createSession(), request));
    return json(response, 200, { authenticated: true });
  } catch (error) {
    return json(response, 503, { error: error.message.includes('configured') ? error.message : 'Sign-in is temporarily unavailable.' });
  }
};
