(() => {
  const DATA = window.WHIMSY_DATA;
  const body = document.body;
  const intro = document.querySelector('.intro');
  const enter = document.querySelector('.enter-control');
  const worldStage = document.querySelector('.world-stage');
  const camera = document.querySelector('.camera');
  const world = document.querySelector('.world');
  const nodes = [...document.querySelectorAll('.function-node')];
  const functionLayer = document.querySelector('.function-layer');
  const missionLayer = document.querySelector('.mission-layer');
  const searchPanel = document.querySelector('.search-panel');
  const searchInput = searchPanel.querySelector('input');
  const phaseKeys = Object.keys(DATA.phases);
  let currentPhase = 'observe';
  let phaseTimer = null;
  let playing = true;
  let activeFunction = null;
  let cam = {x:0,y:0,scale:1};
  let cameraTarget = {x:0,y:0,scale:1};
  let cameraRaf = null;
  let drag = null;

  const glow = document.querySelector('.cursor-glow');
  if (window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', e => { glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`; });
  }

  function enterWorld(){
    if(body.classList.contains('entered')) return;
    body.classList.add('entered');
    setTimeout(() => startSequence(), 900);
  }
  enter.addEventListener('click', enterWorld);
  window.addEventListener('wheel', e => { if(!body.classList.contains('entered') && e.deltaY > 14) enterWorld(); }, {passive:true});
  window.addEventListener('keydown', e => { if(!body.classList.contains('entered') && ['Enter','ArrowDown',' '].includes(e.key)) enterWorld(); });

  function setPhase(key, restart=false){
    const phase = DATA.phases[key];
    if(!phase) return;
    currentPhase = key;
    document.querySelector('.phase-index').textContent = phase.index;
    document.querySelector('.phase-title').textContent = phase.name;
    document.querySelector('.phase-thesis').textContent = phase.thesis;
    document.querySelector('.phase-owner').textContent = `${phase.owner} · ${phase.output}`;
    document.querySelectorAll('.phase-ribbon [data-phase]').forEach(btn => btn.classList.toggle('active', btn.dataset.phase === key));
    nodes.forEach(node => {
      const active = phase.functions.includes(node.dataset.function);
      node.classList.toggle('phase-active', active);
      node.classList.toggle('phase-muted', !active);
      node.querySelector('em').textContent = active && key !== 'observe' ? phase.name : '';
    });
    document.querySelectorAll('[data-link]').forEach(path => path.classList.toggle('phase-active', phase.functions.includes(path.dataset.link)));
    document.querySelectorAll('[data-rel]').forEach(path => {
      const required = path.dataset.functions.split(' ');
      path.classList.toggle('phase-active', key !== 'observe' && required.every(fn => phase.functions.includes(fn)));
    });
    if(restart && playing) startSequence();
  }
  function startSequence(){
    clearInterval(phaseTimer);
    if(!playing || functionLayer.classList.contains('open') || missionLayer.classList.contains('open')) return;
    phaseTimer = setInterval(() => {
      const next = (phaseKeys.indexOf(currentPhase) + 1) % phaseKeys.length;
      setPhase(phaseKeys[next]);
    }, 4700);
  }
  document.querySelectorAll('.phase-ribbon [data-phase]').forEach(btn => btn.addEventListener('click', () => setPhase(btn.dataset.phase, true)));
  const playBtn = document.querySelector('.phase-play');
  playBtn.addEventListener('click', () => {
    playing = !playing;
    playBtn.setAttribute('aria-pressed', String(playing));
    playBtn.textContent = playing ? 'Ⅱ' : '▶';
    playBtn.title = playing ? 'Pause automatic sequence' : 'Play automatic sequence';
    startSequence();
  });

  function traceFunction(key, on){
    world.classList.toggle('has-hover', on);
    const node = document.querySelector(`[data-function="${key}"]`);
    node?.classList.toggle('hover-active', on);
    document.querySelector(`[data-link="${key}"]`)?.classList.toggle('hover-active', on);
    document.querySelectorAll('[data-rel]').forEach(path => {
      if(path.dataset.functions.split(' ').includes(key)) path.classList.toggle('hover-active', on);
    });
  }
  nodes.forEach(node => {
    const key = node.dataset.function;
    node.addEventListener('mouseenter', () => traceFunction(key,true));
    node.addEventListener('mouseleave', () => { traceFunction(key,false); node.style.removeProperty('--tilt'); });
    node.addEventListener('pointermove', e => {
      if(e.pointerType === 'touch') return;
      const r = node.getBoundingClientRect();
      const rx = ((e.clientY-r.top)/r.height-.5)*-4;
      const ry = ((e.clientX-r.left)/r.width-.5)*6;
      node.style.transform = `translate(-50%,-50%) perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.025)`;
    });
    node.addEventListener('pointerleave', () => node.style.transform = 'translate(-50%,-50%)');
    node.addEventListener('click', () => openFunction(key));
  });

  function openFunction(key){
    const item = DATA.functions[key];
    if(!item) return;
    activeFunction = key;
    clearInterval(phaseTimer);
    body.classList.add('detail-mode');
    functionLayer.querySelector('.detail-icon').src = item.icon;
    functionLayer.querySelector('.detail-function-number').textContent = item.number;
    functionLayer.querySelector('h2').textContent = item.name;
    functionLayer.querySelector('.function-thesis').textContent = item.thesis;
    functionLayer.querySelector('.leads-to strong').textContent = item.destination;
    const roleList = functionLayer.querySelector('.phase-role-list');
    roleList.innerHTML = item.roles.map(role => `<div class="phase-role"><strong>${role.phase}</strong><span>${role.action}</span><small>${role.owner}</small></div>`).join('');
    const missionList = functionLayer.querySelector('.mission-list');
    missionList.innerHTML = item.missions.map((m,i) => `<button type="button" class="mission-card" data-mission="${i}"><strong>${m.name}</strong><small>${m.phase} · ${m.owner}</small><span>↗</span></button>`).join('');
    missionList.querySelectorAll('.mission-card').forEach(btn => btn.addEventListener('click', () => openMission(key, Number(btn.dataset.mission))));
    functionLayer.classList.add('open');
    functionLayer.setAttribute('aria-hidden','false');
  }
  function closeFunction(){
    functionLayer.classList.remove('open');
    functionLayer.setAttribute('aria-hidden','true');
    body.classList.remove('detail-mode');
    activeFunction = null;
    startSequence();
  }
  document.querySelector('.layer-close').addEventListener('click', closeFunction);
  document.querySelector('.home-control').addEventListener('click', () => { closeMission(); closeFunction(); resetCamera(); });

  function openMission(key,index){
    const fn = DATA.functions[key];
    const m = fn?.missions[index];
    if(!m) return;
    missionLayer.querySelector('h2').textContent = m.name;
    missionLayer.querySelector('.mission-meta').textContent = `${fn.name.toUpperCase()} · ${m.phase.toUpperCase()}`;
    missionLayer.querySelector('.mission-problem').textContent = m.problem;
    missionLayer.querySelector('.mission-deliverable').textContent = m.deliverable;
    missionLayer.querySelector('.mission-proof').textContent = m.proof;
    missionLayer.querySelector('.mission-owner').textContent = m.owner;
    missionLayer.querySelector('.mission-signal').href = `mailto:admin@whimsycyberspace.com?subject=${encodeURIComponent('Whimsy mission — '+m.name)}`;
    missionLayer.classList.add('open');
    missionLayer.setAttribute('aria-hidden','false');
  }
  function closeMission(){ missionLayer.classList.remove('open'); missionLayer.setAttribute('aria-hidden','true'); }
  document.querySelector('.mission-back').addEventListener('click', closeMission);

  function updateMinimap(){
    const vi = document.querySelector('.viewport-indicator');
    const size = Math.max(24,54/cam.scale);
    vi.style.width = `${size}%`; vi.style.height = `${size}%`;
    vi.style.left = `${23 - cam.x/60}%`; vi.style.top = `${23 - cam.y/38}%`;
  }
  function renderCamera(){
    world.style.transform = `translate(calc(-50% + ${cam.x}px), calc(-50% + ${cam.y}px)) scale(${cam.scale})`;
    updateMinimap();
  }
  function animateCamera(){
    const ease = drag ? .32 : .16;
    cam.x += (cameraTarget.x-cam.x)*ease;
    cam.y += (cameraTarget.y-cam.y)*ease;
    cam.scale += (cameraTarget.scale-cam.scale)*ease;
    renderCamera();
    const moving = Math.abs(cameraTarget.x-cam.x)>.08 || Math.abs(cameraTarget.y-cam.y)>.08 || Math.abs(cameraTarget.scale-cam.scale)>.0005;
    if(moving){ cameraRaf=requestAnimationFrame(animateCamera); }
    else { cam={...cameraTarget}; renderCamera(); cameraRaf=null; }
  }
  function requestCamera(){ if(!cameraRaf) cameraRaf=requestAnimationFrame(animateCamera); }
  function resetCamera(){
    const scale=window.innerWidth<900?.58:.78;
    cam={x:0,y:0,scale}; cameraTarget={...cam}; renderCamera();
  }
  resetCamera();
  camera.addEventListener('pointerdown', e => {
    if(e.target.closest('button')) return;
    e.preventDefault();
    drag={sx:e.clientX,sy:e.clientY,x:cameraTarget.x,y:cameraTarget.y};
    camera.classList.add('dragging');
    camera.setPointerCapture(e.pointerId);
  });
  camera.addEventListener('pointermove', e => {
    if(!drag) return;
    cameraTarget.x=drag.x+(e.clientX-drag.sx);
    cameraTarget.y=drag.y+(e.clientY-drag.sy);
    requestCamera();
  });
  function endDrag(e){
    if(!drag) return;
    drag=null; camera.classList.remove('dragging');
    if(e?.pointerId && camera.hasPointerCapture(e.pointerId)) camera.releasePointerCapture(e.pointerId);
  }
  camera.addEventListener('pointerup', endDrag);
  camera.addEventListener('pointercancel', endDrag);
  camera.addEventListener('wheel', e => {
    if(!body.classList.contains('entered')) return;
    e.preventDefault();

    // Trackpads emit many small deltas; mouse wheels emit fewer large ones.
    // Exponential scaling preserves that distinction and keeps both inputs gradual.
    const modeScale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    const dy = Math.max(-90,Math.min(90,e.deltaY*modeScale));
    const zoomFactor = Math.exp(-dy*0.00145);
    const minScale = window.innerWidth<900 ? .46 : .56;
    const maxScale = 1.08;
    const oldScale = cameraTarget.scale;
    const nextScale = Math.min(maxScale,Math.max(minScale,oldScale*zoomFactor));
    if(Math.abs(nextScale-oldScale)<.0001) return;

    // Keep the point under the cursor visually anchored while zooming.
    const rect=camera.getBoundingClientRect();
    const px=e.clientX-(rect.left+rect.width/2);
    const py=e.clientY-(rect.top+rect.height/2);
    const ratio=nextScale/oldScale;
    cameraTarget.x = px-(px-cameraTarget.x)*ratio;
    cameraTarget.y = py-(py-cameraTarget.y)*ratio;
    cameraTarget.scale = nextScale;
    requestCamera();
  }, {passive:false});

  function buildSearch(query=''){
    const q=query.trim().toLowerCase();
    const rows=[];
    Object.entries(DATA.functions).forEach(([key,fn]) => {
      if(!q || `${fn.name} ${fn.thesis} ${fn.destination}`.toLowerCase().includes(q)) rows.push({type:'Function',key,title:fn.name,sub:fn.thesis,icon:fn.icon});
      fn.missions.forEach((m,index) => { if(q && `${m.name} ${m.phase} ${m.owner} ${m.problem}`.toLowerCase().includes(q)) rows.push({type:'Mission',key,index,title:m.name,sub:`${fn.name} · ${m.phase}`,icon:fn.icon}); });
    });
    const container=searchPanel.querySelector('.search-results');
    container.innerHTML = rows.slice(0,14).map((r,i)=>`<button class="search-result" type="button" data-result="${i}"><img src="${r.icon}" alt=""><span><strong>${r.title}</strong><small>${r.sub}</small></span><em>${r.type}</em></button>`).join('');
    container.querySelectorAll('.search-result').forEach((btn,i)=>btn.addEventListener('click',()=>{
      const r=rows[i]; closeSearch(); openFunction(r.key); if(r.type==='Mission') setTimeout(()=>openMission(r.key,r.index),420);
    }));
  }
  function openSearch(){ searchPanel.classList.add('open'); searchPanel.setAttribute('aria-hidden','false'); buildSearch(''); setTimeout(()=>searchInput.focus(),50); }
  function closeSearch(){ searchPanel.classList.remove('open'); searchPanel.setAttribute('aria-hidden','true'); searchInput.value=''; }
  document.querySelector('.search-control').addEventListener('click',openSearch);
  searchInput.addEventListener('input',()=>buildSearch(searchInput.value));
  searchPanel.addEventListener('click',e=>{if(e.target===searchPanel)closeSearch()});
  window.addEventListener('keydown',e=>{
    if(e.key==='/' && !searchPanel.classList.contains('open') && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();openSearch();}
    if(e.key==='Escape'){ if(searchPanel.classList.contains('open')) closeSearch(); else if(missionLayer.classList.contains('open')) closeMission(); else if(functionLayer.classList.contains('open')) closeFunction(); }
  });

  setPhase('observe');
})();
