const crypto = require('node:crypto');
const DATA = require('../../data.js');

const STATUSES = ['Not started', 'In progress', 'Completed'];
const PHASES = Object.values(DATA.phases).map(phase => phase.name);

function slug(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function seedDocument() {
  const createdAt = '2026-08-14T00:00:00.000Z';
  const missions = [];
  Object.entries(DATA.functions).forEach(([functionKey, fn]) => {
    fn.missions.forEach((mission, index) => missions.push({
      id: `${functionKey}-${String(index + 1).padStart(2, '0')}-${slug(mission.name)}`,
      functionKey,
      name: mission.name,
      phase: mission.phase,
      owner: mission.owner,
      problem: mission.problem,
      deliverable: mission.deliverable,
      proof: mission.proof,
      status: 'Not started',
      createdAt,
      updatedAt: createdAt,
      completedAt: null,
      archived: false
    }));
  });
  return { version: 1, revision: 0, missions };
}

function cleanText(value, field, max = 1200) {
  if (typeof value !== 'string') throw new Error(`${field} must be text.`);
  const clean = value.trim();
  if (!clean) throw new Error(`${field} is required.`);
  if (clean.length > max) throw new Error(`${field} is too long.`);
  return clean;
}

function validateMission(input, existing = null) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Mission details are required.');
  const functionKey = cleanText(input.functionKey, 'Function', 40);
  if (!DATA.functions[functionKey]) throw new Error('Choose a valid function.');
  const phase = cleanText(input.phase, 'Phase', 40);
  if (!PHASES.includes(phase)) throw new Error('Choose a valid phase.');
  const status = cleanText(input.status || existing?.status || 'Not started', 'Status', 40);
  if (!STATUSES.includes(status)) throw new Error('Choose a valid status.');
  const now = new Date().toISOString();
  return {
    id: existing?.id || crypto.randomUUID(),
    functionKey,
    name: cleanText(input.name, 'Title', 180),
    phase,
    owner: cleanText(input.owner, 'Owner', 180),
    problem: cleanText(input.problem, 'Problem', 1600),
    deliverable: cleanText(input.deliverable, 'Deliverable', 1600),
    proof: cleanText(input.proof, 'Evidence', 1600),
    status,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    completedAt: status === 'Completed' ? (existing?.completedAt || now) : null,
    archived: Boolean(input.archived ?? existing?.archived ?? false)
  };
}

module.exports = { DATA, PHASES, STATUSES, seedDocument, validateMission };
