const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source=fs.readFileSync('app.js','utf8');

test('desktop camera defines three soft resting levels',()=>{
  assert.match(source,/return \[\.62,\.78,1\.02\]/);
  assert.match(source,/zoomResistance/);
  assert.match(source,/settleDesktopZoom/);
});

test('wheel zoom remains cursor anchored and mobile path is preserved',()=>{
  assert.match(source,/cameraState\.targetX=px-\(px-cameraState\.targetX\)\*ratio/);
  assert.match(source,/if\(isGuidedCamera\(\)\) return;/);
  assert.match(source,/focusFunctionNode/);
});
