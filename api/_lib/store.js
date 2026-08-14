const fs = require('node:fs/promises');
const path = require('node:path');
const { seedDocument } = require('./missions');

const BLOB_PATH = 'whimsy/living-missions.json';

async function readLocal(filename) {
  try { return { document: JSON.parse(await fs.readFile(filename, 'utf8')), etag: null }; }
  catch (error) { if (error.code === 'ENOENT') return { document: seedDocument(), etag: null }; throw error; }
}

async function readBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  const { get } = require('@vercel/blob');
  const result = await get(BLOB_PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode === 404) return { document: seedDocument(), etag: null };
  if (result.statusCode !== 200) throw new Error(`Mission storage returned ${result.statusCode}.`);
  const text = await new Response(result.stream).text();
  return { document: JSON.parse(text), etag: result.etag || null };
}

async function loadDocument() {
  const local = process.env.WHIMSY_DATA_FILE;
  return local ? readLocal(path.resolve(local)) : readBlob();
}

async function saveDocument(document, etag = null) {
  const local = process.env.WHIMSY_DATA_FILE;
  if (local) {
    const filename = path.resolve(local);
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, `${JSON.stringify(document, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not configured.');
  const { put } = require('@vercel/blob');
  await put(BLOB_PATH, JSON.stringify(document), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
    ...(etag ? { ifMatch: etag } : {})
  });
}

module.exports = { loadDocument, saveDocument };
