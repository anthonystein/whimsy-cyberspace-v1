const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const missionsHandler = require('../api/missions');
const loginHandler = require('../api/auth/login');
const sessionHandler = require('../api/auth/session');
const { seedDocument, validateMission } = require('../api/_lib/missions');

function responseMock() {
  return { statusCode: 0, headers: {}, setHeader(key,value){this.headers[key.toLowerCase()]=value;}, end(value){this.value=value;}, json(){return JSON.parse(this.value);} };
}
function request(method, body={}, cookie='') {
  const req = new EventEmitter();
  req.method=method; req.body=body; req.query={}; req.headers={host:'localhost:4173',origin:'http://localhost:4173','content-type':'application/json',cookie};
  return req;
}
async function call(handler, req){ const res=responseMock(); await handler(req,res); return res; }

test.before(async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'whimsy-missions-'));
  process.env.WHIMSY_DATA_FILE=path.join(dir,'missions.json');
  process.env.WHIMSY_SESSION_SECRET=crypto.randomBytes(32).toString('base64url');
  const salt=crypto.randomBytes(16); const cost=16384;
  const hash=crypto.scryptSync('correct horse battery',salt,32,{N:cost,r:8,p:1,maxmem:256*1024*1024});
  process.env.WHIMSY_ADMIN_KEY_HASH=`scrypt$${cost}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
});

test('seed preserves all 24 existing missions with stable IDs',()=>{
  const document=seedDocument();
  assert.equal(document.missions.length,24);
  assert.equal(new Set(document.missions.map(m=>m.id)).size,24);
  assert.ok(document.missions.every(m=>m.status==='Not started' && !m.archived));
});

test('mission validation rejects unknown phases and functions',()=>{
  const valid=seedDocument().missions[0];
  assert.throws(()=>validateMission({...valid,phase:'Invent'}),/valid phase/);
  assert.throws(()=>validateMission({...valid,functionKey:'unknown'}),/valid function/);
});

test('public reads work, mutations require auth, and revision conflicts are rejected',async()=>{
  let res=await call(missionsHandler,request('GET'));
  assert.equal(res.statusCode,200);
  assert.equal(res.json().missions.length,24);

  res=await call(missionsHandler,request('POST',{revision:0,mission:seedDocument().missions[0]}));
  assert.equal(res.statusCode,401);

  const login=await call(loginHandler,request('POST',{passphrase:'correct horse battery'}));
  assert.equal(login.statusCode,200);
  const cookie=login.headers['set-cookie'].split(';')[0];
  const session=await call(sessionHandler,request('GET',{},cookie));
  assert.equal(session.json().authenticated,true);

  const newMission={...seedDocument().missions[0],id:undefined,name:'Test living mission'};
  res=await call(missionsHandler,request('POST',{revision:0,mission:newMission},cookie));
  assert.equal(res.statusCode,200);
  assert.equal(res.json().revision,1);
  assert.equal(res.json().missions.length,25);

  res=await call(missionsHandler,request('POST',{revision:0,mission:newMission},cookie));
  assert.equal(res.statusCode,409);
});

test('same-origin check blocks authenticated cross-site mutations',async()=>{
  const login=await call(loginHandler,request('POST',{passphrase:'correct horse battery'}));
  const cookie=login.headers['set-cookie'].split(';')[0];
  const req=request('DELETE',{revision:1,id:'anything'},cookie);
  req.headers.origin='https://attacker.example';
  const res=await call(missionsHandler,req);
  assert.equal(res.statusCode,403);
});
