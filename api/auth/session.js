const { json, methodNotAllowed } = require('../_lib/http');
const { isAuthenticated } = require('../_lib/auth');

module.exports = function handler(request, response) {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  return json(response, 200, { authenticated: isAuthenticated(request) });
};
