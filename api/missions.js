const { body, json, methodNotAllowed, requireJson, requireSameOrigin } = require('./_lib/http');
const { isAuthenticated } = require('./_lib/auth');
const { loadDocument, saveDocument } = require('./_lib/store');
const { validateMission } = require('./_lib/missions');

function publicDocument(document, includeArchived = false) {
  return {
    version: document.version,
    revision: document.revision,
    missions: document.missions.filter(mission => includeArchived || !mission.archived)
  };
}

module.exports = async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      const { document } = await loadDocument();
      const includeArchived = request.query?.archived === '1' && isAuthenticated(request);
      return json(response, 200, publicDocument(document, includeArchived));
    }
    if (!['POST', 'PATCH', 'DELETE'].includes(request.method)) return methodNotAllowed(response, ['GET', 'POST', 'PATCH', 'DELETE']);
    if (!isAuthenticated(request)) return json(response, 401, { error: 'Please sign in again.' });
    if (!requireSameOrigin(request)) return json(response, 403, { error: 'Request origin was rejected.' });
    if (!requireJson(request)) return json(response, 415, { error: 'JSON content is required.' });
    const input = await body(request);
    const { document, etag } = await loadDocument();
    if (!Number.isInteger(input.revision) || input.revision !== document.revision) return json(response, 409, { error: 'Missions changed elsewhere. Refresh and try again.', revision: document.revision });

    if (request.method === 'POST') {
      document.missions.push(validateMission(input.mission));
    } else {
      const index = document.missions.findIndex(mission => mission.id === input.id);
      if (index < 0) return json(response, 404, { error: 'Mission not found.' });
      if (request.method === 'PATCH') document.missions[index] = validateMission(input.mission, document.missions[index]);
      else document.missions[index] = { ...document.missions[index], archived: true, updatedAt: new Date().toISOString() };
    }
    document.revision += 1;
    await saveDocument(document, etag);
    return json(response, 200, publicDocument(document, true));
  } catch (error) {
    if (error?.name === 'BlobPreconditionFailedError') return json(response, 409, { error: 'Missions changed elsewhere. Refresh and try again.' });
    if (/required|valid|too long|must be/.test(error.message)) return json(response, 400, { error: error.message });
    console.error(error);
    return json(response, 503, { error: 'Mission storage is temporarily unavailable.' });
  }
};
