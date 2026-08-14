(() => {
  const DATA = window.WHIMSY_DATA;
  const body = document.body;
  const intro = document.querySelector('.intro');
  const enter = document.querySelector('.enter-control');
  const worldStage = document.querySelector('.world-stage');
  const camera = document.querySelector('.camera');
  const world = document.querySelector('.world');
  const nodes = [...document.querySelectorAll('.function-node')];
  const coreNode = document.querySelector('[data-core]');
  const phaseRibbon = document.querySelector('.phase-ribbon');
  const phaseScroller = phaseRibbon.querySelector('.phase-scroll');
  const functionLayer = document.querySelector('.function-layer');
  const missionLayer = document.querySelector('.mission-layer');
  const searchPanel = document.querySelector('.search-panel');
  const searchInput = searchPanel.querySelector('input');
  const phaseKeys = Object.keys(DATA.phases);
  let currentPhase = 'observe';
  let phaseTimer = null;
  let playing = true;
  let activeFunction = null;
  const WORLD_WIDTH = 1600;
  const WORLD_HEIGHT = 1000;
  const cameraState = {x:0,y:0,scale:.78,targetX:0,targetY:0,targetScale:.78,vx:0,vy:0};
  let cameraRaf = null;
  let geometryCache = new Map();
  const activePointers = new Map();
  let gesture = null;
  let ignoreClickUntil = 0;
  let magnetTimer = null;
  let resizeTimer = null;
  let interactionResumeTimer = null;
  let wheelSettleTimer = null;
  let wheelInteracting = false;
  let wheelMotion = {velocity:0,lastTime:0,anchorX:0,anchorY:0,worldX:0,worldY:0};
  let missionRevision = 0;
  let activeMissionId = null;
  let editorEnabled = false;

  const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const isGuidedCamera = () => window.innerWidth <= 900 || window.matchMedia('(pointer:coarse)').matches;

  const glow = document.querySelector('.cursor-glow');
  if (window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', e => { glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`; });
  }

  function enterWorld(){
    if(body.classList.contains('entered')) return;
    window.scrollTo(0,0);
    body.classList.add('entered');
    requestAnimationFrame(() => {
      cacheNodeGeometry();
      if(isGuidedCamera()) fitPhaseToViewport(currentPhase);
    });
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
    const guidedCamera=isGuidedCamera();
    if(guidedCamera) scrollActivePhaseIntoView(key);
    if(body.classList.contains('entered') && (guidedCamera || restart)) fitPhaseToViewport(key);
    if(restart && playing) startSequence();
  }

  function scrollActivePhaseIntoView(key){
    const button = phaseRibbon.querySelector(`[data-phase="${key}"]`);
    if(!button) return;
    const left = button.offsetLeft - (phaseScroller.clientWidth-button.offsetWidth)/2;
    phaseScroller.scrollTo({left:Math.max(0,left),behavior:'smooth'});
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
    clearTimeout(interactionResumeTimer);
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
    node.addEventListener('click', e => {
      if(performance.now() < ignoreClickUntil){ e.preventDefault(); return; }
      if(isGuidedCamera()) focusFunctionNode(key);
      else openFunction(key);
    });
  });
  coreNode.addEventListener('click', e => {
    if(performance.now() < ignoreClickUntil){ e.preventDefault(); return; }
    if(isGuidedCamera()) fitNodesToViewport([], {includeCore:true,padding:52,minScale:.56,maxScale:.68});
  });

  function focusFunctionNode(key){
    fitNodesToViewport([key], {includeCore:true,padding:34,minScale:.46,maxScale:.76});
    setTimeout(() => {
      if(activePointers.size===0 && performance.now() >= ignoreClickUntil) openFunction(key);
    }, 380);
  }

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
    missionList.innerHTML = item.missions.map((m,i) => `<button type="button" class="mission-card" data-mission="${i}"><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.phase)} · ${escapeHTML(m.owner)}</small><span>↗</span><em class="mission-card-status">${escapeHTML(m.status || 'Not started')}</em></button>`).join('');
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
    activeMissionId = m.id || null;
    missionLayer.querySelector('h2').textContent = m.name;
    missionLayer.querySelector('.mission-meta').textContent = `${fn.name.toUpperCase()} · ${m.phase.toUpperCase()}`;
    missionLayer.querySelector('.mission-problem').textContent = m.problem;
    missionLayer.querySelector('.mission-deliverable').textContent = m.deliverable;
    missionLayer.querySelector('.mission-proof').textContent = m.proof;
    missionLayer.querySelector('.mission-owner').textContent = m.owner;
    missionLayer.querySelector('.mission-status').textContent = m.status || 'Not started';
    missionLayer.querySelector('.mission-signal').href = `mailto:admin@whimsycyberspace.com?subject=${encodeURIComponent('Whimsy mission — '+m.name)}`;
    missionLayer.classList.add('open');
    missionLayer.setAttribute('aria-hidden','false');
  }
  function closeMission(){ missionLayer.classList.remove('open'); missionLayer.setAttribute('aria-hidden','true'); activeMissionId=null; }
  document.querySelector('.mission-back').addEventListener('click', closeMission);

  function getScaleLimits(){
    if(window.innerWidth<=900 && window.innerHeight<=600) return {min:.24,max:1.04};
    if(window.innerWidth<=600) return {min:.30,max:1};
    if(window.innerWidth<=900) return {min:.36,max:1.04};
    return {min:.52,max:1.14};
  }

  function cacheNodeGeometry(){
    const next = new Map();
    [["core",coreNode],...nodes.map(node=>[node.dataset.function,node])].forEach(([id,element]) => {
      next.set(id,{x:element.offsetLeft,y:element.offsetTop,width:element.offsetWidth,height:element.offsetHeight});
    });
    geometryCache = next;
  }

  function getCameraBounds(scale){
    const rect = camera.getBoundingClientRect();
    const overscroll = isGuidedCamera() ? Math.min(96,rect.width*.22) : Math.min(340,rect.width*.26);
    return {
      x:Math.max(0,WORLD_WIDTH*scale/2-rect.width/2+overscroll),
      y:Math.max(0,WORLD_HEIGHT*scale/2-rect.height/2+overscroll)
    };
  }

  function softBound(value,limit){
    if(value>limit) return limit+(value-limit)*.24;
    if(value<-limit) return -limit+(value+limit)*.24;
    return value;
  }

  function constrainCameraTarget(soft=false){
    const limits = getScaleLimits();
    cameraState.targetScale = clamp(cameraState.targetScale,limits.min,limits.max);
    const bounds = getCameraBounds(cameraState.targetScale);
    cameraState.targetX = soft ? softBound(cameraState.targetX,bounds.x) : clamp(cameraState.targetX,-bounds.x,bounds.x);
    cameraState.targetY = soft ? softBound(cameraState.targetY,bounds.y) : clamp(cameraState.targetY,-bounds.y,bounds.y);
  }

  function setCameraTarget(target,{instant=false,soft=false,keepMomentum=false}={}){
    cameraState.targetX = target.x;
    cameraState.targetY = target.y;
    cameraState.targetScale = target.scale;
    if(!keepMomentum){ cameraState.vx=0; cameraState.vy=0; }
    constrainCameraTarget(soft);
    if(instant){
      cameraState.x=cameraState.targetX;
      cameraState.y=cameraState.targetY;
      cameraState.scale=cameraState.targetScale;
      renderCamera();
    }else requestCamera();
  }

  function getFitTarget(nodeIds,options={}){
    if(!geometryCache.size) cacheNodeGeometry();
    const ids = [...new Set([...(nodeIds||[]),...(options.includeCore?["core"]:[])])];
    const boxes = ids.map(id=>geometryCache.get(id)).filter(Boolean);
    if(!boxes.length) boxes.push(geometryCache.get('core'));
    const paddingValue = options.padding ?? (isGuidedCamera()?24:64);
    const padding = typeof paddingValue==='number' ? {top:paddingValue,right:paddingValue,bottom:paddingValue,left:paddingValue} : paddingValue;
    const minX=Math.min(...boxes.map(box=>box.x-box.width/2));
    const maxX=Math.max(...boxes.map(box=>box.x+box.width/2));
    const minY=Math.min(...boxes.map(box=>box.y-box.height/2));
    const maxY=Math.max(...boxes.map(box=>box.y+box.height/2));
    const rect=camera.getBoundingClientRect();
    const usableWidth=Math.max(1,rect.width-padding.left-padding.right);
    const usableHeight=Math.max(1,rect.height-padding.top-padding.bottom);
    const limits=getScaleLimits();
    const scale=clamp(Math.min(usableWidth/Math.max(1,maxX-minX),usableHeight/Math.max(1,maxY-minY)),options.minScale??limits.min,options.maxScale??limits.max);
    const offsetX=(padding.left-padding.right)/2+(options.offsetX||0);
    const offsetY=(padding.top-padding.bottom)/2+(options.offsetY||0);
    return {
      x:offsetX-(((minX+maxX)/2)-WORLD_WIDTH/2)*scale,
      y:offsetY-(((minY+maxY)/2)-WORLD_HEIGHT/2)*scale,
      scale
    };
  }

  function fitNodesToViewport(nodeIds,options={}){
    const target=getFitTarget(nodeIds,options);
    setCameraTarget(target,{instant:Boolean(options.instant)});
    return target;
  }

  function getPhaseTarget(key){
    const phase=DATA.phases[key];
    if(!phase || key==='observe'){
      if(!isGuidedCamera()) return {x:0,y:0,scale:.78};
      const rect=camera.getBoundingClientRect();
      return {x:0,y:0,scale:clamp(rect.width/1020,.37,.42)};
    }
    if(!isGuidedCamera()) return getFitTarget(phase.functions,{includeCore:true,padding:86,minScale:.62,maxScale:.78});
    const landscape=window.innerWidth<=900 && window.innerHeight<=600;
    return getFitTarget(phase.functions,{includeCore:true,padding:landscape?6:(window.innerWidth<=430?14:28),minScale:landscape?.24:.30,maxScale:.62});
  }

  function fitPhaseToViewport(key,{instant=false}={}){
    setCameraTarget(getPhaseTarget(key),{instant});
  }

  function resetCamera({instant=true}={}){
    if(isGuidedCamera()) fitPhaseToViewport(currentPhase,{instant});
    else setCameraTarget({x:0,y:0,scale:.78},{instant});
  }

  function updateMinimap(){
    const vi = document.querySelector('.viewport-indicator');
    const size = Math.max(24,54/cameraState.scale);
    vi.style.width = `${size}%`; vi.style.height = `${size}%`;
    vi.style.left = `${23 - cameraState.x/60}%`; vi.style.top = `${23 - cameraState.y/38}%`;
  }

  function renderCamera(){
    world.style.transform = `translate3d(calc(-50% + ${cameraState.x}px),calc(-50% + ${cameraState.y}px),0) scale(${cameraState.scale})`;
    updateMinimap();
  }

  function animateCamera(){
    const hasPointers=activePointers.size>0;
    if(!hasPointers && (Math.abs(cameraState.vx)>.04 || Math.abs(cameraState.vy)>.04)){
      cameraState.targetX+=cameraState.vx;
      cameraState.targetY+=cameraState.vy;
      cameraState.vx*=.90;
      cameraState.vy*=.90;
      constrainCameraTarget(false);
    }else if(!hasPointers){ cameraState.vx=0; cameraState.vy=0; }
    const ease=hasPointers
      ? (isGuidedCamera()?.40:.54)
      : wheelInteracting
        ? .44
        : (Math.abs(cameraState.vx)+Math.abs(cameraState.vy)>.1 ? .23 : (isGuidedCamera()?.15:.19));
    cameraState.x+=(cameraState.targetX-cameraState.x)*ease;
    cameraState.y+=(cameraState.targetY-cameraState.y)*ease;
    cameraState.scale+=(cameraState.targetScale-cameraState.scale)*ease;
    renderCamera();
    const moving=Math.abs(cameraState.targetX-cameraState.x)>.08 || Math.abs(cameraState.targetY-cameraState.y)>.08 || Math.abs(cameraState.targetScale-cameraState.scale)>.0005 || Math.abs(cameraState.vx)+Math.abs(cameraState.vy)>.08;
    if(moving) cameraRaf=requestAnimationFrame(animateCamera);
    else{
      cameraState.x=cameraState.targetX;
      cameraState.y=cameraState.targetY;
      cameraState.scale=cameraState.targetScale;
      renderCamera();
      cameraRaf=null;
    }
  }

  function requestCamera(){ if(!cameraRaf) cameraRaf=requestAnimationFrame(animateCamera); }

  function cancelMagnetism(){
    clearTimeout(magnetTimer);
    cameraState.vx=0; cameraState.vy=0;
    cameraState.targetX=cameraState.x;
    cameraState.targetY=cameraState.y;
    cameraState.targetScale=cameraState.scale;
  }

  function applyMagnetism(){
    if(activePointers.size || wheelInteracting) return;
    const guided=isGuidedCamera();
    const rect=camera.getBoundingClientRect();
    const threshold=guided ? Math.min(108,rect.width*.25) : Math.min(84,rect.width*.12);
    const candidates=['core',...DATA.phases[currentPhase].functions];
    let nearest=null;
    candidates.forEach(id=>{
      const box=geometryCache.get(id);
      if(!box) return;
      const screenX=cameraState.targetX+(box.x-WORLD_WIDTH/2)*cameraState.targetScale;
      const screenY=cameraState.targetY+(box.y-WORLD_HEIGHT/2)*cameraState.targetScale;
      const distance=Math.hypot(screenX,screenY);
      if(distance<threshold && (!nearest || distance<nearest.distance)) nearest={id,distance};
    });
    let ideal=null;
    let strength=guided?.18:.07;
    if(nearest){
      ideal=nearest.id==='core'
        ? getFitTarget([],{includeCore:true,padding:guided?52:78,minScale:guided?.56:.68,maxScale:guided?.68:.78})
        : getFitTarget([nearest.id],{includeCore:true,padding:guided?32:72,minScale:guided?.46:.58,maxScale:guided?.70:.78});
    }else if(currentPhase!=='observe'){
      const phaseTarget=getPhaseTarget(currentPhase);
      const distance=Math.hypot(phaseTarget.x-cameraState.targetX,phaseTarget.y-cameraState.targetY)+Math.abs(phaseTarget.scale-cameraState.targetScale)*180;
      if(distance<(guided?118:92)){ ideal=phaseTarget; strength=guided?.13:.055; }
    }
    if(!ideal) return;
    cameraState.vx=0; cameraState.vy=0;
    cameraState.targetX+=(ideal.x-cameraState.targetX)*strength;
    cameraState.targetY+=(ideal.y-cameraState.targetY)*strength;
    cameraState.targetScale+=(ideal.scale-cameraState.targetScale)*strength;
    constrainCameraTarget(false);
    requestCamera();
  }

  function beginPan(pointer){
    gesture={mode:'pan',moved:false,startX:pointer.x,startY:pointer.y,lastX:pointer.x,lastY:pointer.y,lastTime:performance.now(),velocityX:0,velocityY:0};
  }

  function beginWheelInteraction(){
    clearInterval(phaseTimer);
    clearTimeout(interactionResumeTimer);
    clearTimeout(magnetTimer);
    if(!wheelInteracting){ cancelMagnetism(); wheelMotion.velocity=0; wheelMotion.lastTime=performance.now(); }
    else{ cameraState.vx=0; cameraState.vy=0; }
    wheelInteracting=true;
    clearTimeout(wheelSettleTimer);
    wheelSettleTimer=setTimeout(()=>{
      wheelInteracting=false;
      settleDesktopZoom();
      requestCamera();
      clearTimeout(magnetTimer);
      if(isGuidedCamera()) magnetTimer=setTimeout(applyMagnetism,220);
      if(playing) interactionResumeTimer=setTimeout(startSequence,5500);
    },180);
  }

  function desktopRestLevels(){
    const limits=getScaleLimits();
    return [.62,.78,1.02].filter(level=>level>=limits.min && level<=limits.max);
  }

  function zoomResistance(scale,delta){
    if(isGuidedCamera()) return 1;
    const nearest=Math.min(...desktopRestLevels().map(level=>Math.abs(level-scale)));
    const gentle=Math.min(1,Math.abs(delta)/42);
    return nearest<.045 ? .56+gentle*.44 : 1;
  }

  function settleDesktopZoom(){
    if(isGuidedCamera()) return;
    const levels=desktopRestLevels();
    const projected=clamp(cameraState.targetScale*Math.exp(-wheelMotion.velocity*.0018),getScaleLimits().min,getScaleLimits().max);
    const rest=levels.reduce((best,level)=>Math.abs(level-projected)<Math.abs(best-projected)?level:best,levels[0]);
    const capture=Math.abs(rest-projected)<.115 || Math.abs(wheelMotion.velocity)<5;
    if(!capture) return;
    const oldScale=cameraState.targetScale;
    const nextScale=rest;
    const ratio=nextScale/oldScale;
    cameraState.targetX=wheelMotion.anchorX-(wheelMotion.anchorX-cameraState.targetX)*ratio;
    cameraState.targetY=wheelMotion.anchorY-(wheelMotion.anchorY-cameraState.targetY)*ratio;
    cameraState.targetScale=nextScale;
    constrainCameraTarget(false);
    wheelMotion.velocity=0;
  }

  function beginPinch(){
    const pointers=[...activePointers.values()];
    if(pointers.length<2) return;
    const [a,b]=pointers;
    const rect=camera.getBoundingClientRect();
    const midX=(a.x+b.x)/2-(rect.left+rect.width/2);
    const midY=(a.y+b.y)/2-(rect.top+rect.height/2);
    const distance=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));
    gesture={mode:'pinch',moved:false,startDistance:distance,startScale:cameraState.targetScale,startMidX:midX,startMidY:midY,worldX:(midX-cameraState.targetX)/cameraState.targetScale,worldY:(midY-cameraState.targetY)/cameraState.targetScale};
  }

  camera.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse' && e.button!==0) return;
    if(e.target.closest('.function-node, .core-node')) return;
    clearInterval(phaseTimer);
    clearTimeout(interactionResumeTimer);
    cancelMagnetism();
    activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    camera.classList.add('dragging');
    camera.setPointerCapture(e.pointerId);
    if(activePointers.size===1) beginPan(activePointers.get(e.pointerId));
    else if(activePointers.size===2) beginPinch();
  });

  camera.addEventListener('pointermove',e=>{
    if(!activePointers.has(e.pointerId)) return;
    e.preventDefault();
    activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(activePointers.size>=2){
      if(gesture?.mode!=='pinch') beginPinch();
      const [a,b]=[...activePointers.values()];
      const rect=camera.getBoundingClientRect();
      const midX=(a.x+b.x)/2-(rect.left+rect.width/2);
      const midY=(a.y+b.y)/2-(rect.top+rect.height/2);
      const distance=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y));
      const limits=getScaleLimits();
      const nextScale=clamp(gesture.startScale*(distance/gesture.startDistance),limits.min,limits.max);
      cameraState.targetScale=nextScale;
      cameraState.targetX=midX-gesture.worldX*nextScale;
      cameraState.targetY=midY-gesture.worldY*nextScale;
      gesture.moved=gesture.moved || Math.abs(distance-gesture.startDistance)>2 || Math.hypot(midX-gesture.startMidX,midY-gesture.startMidY)>3;
      constrainCameraTarget(true);
      requestCamera();
      return;
    }
    const pointer=activePointers.get(e.pointerId);
    if(!gesture || gesture.mode!=='pan') beginPan(pointer);
    const now=performance.now();
    const dx=pointer.x-gesture.lastX;
    const dy=pointer.y-gesture.lastY;
    const dt=Math.max(8,now-gesture.lastTime);
    cameraState.targetX+=dx;
    cameraState.targetY+=dy;
    gesture.velocityX=gesture.velocityX*.58+(dx/dt*16)*.42;
    gesture.velocityY=gesture.velocityY*.58+(dy/dt*16)*.42;
    gesture.lastX=pointer.x; gesture.lastY=pointer.y; gesture.lastTime=now;
    gesture.moved=gesture.moved || Math.hypot(pointer.x-gesture.startX,pointer.y-gesture.startY)>6;
    constrainCameraTarget(true);
    requestCamera();
  });

  function endPointer(e){
    if(!activePointers.has(e.pointerId)) return;
    const endedGesture=gesture;
    activePointers.delete(e.pointerId);
    if(camera.hasPointerCapture(e.pointerId)) camera.releasePointerCapture(e.pointerId);
    if(endedGesture?.moved) ignoreClickUntil=performance.now()+360;
    if(activePointers.size===1){
      beginPan([...activePointers.values()][0]);
      return;
    }
    if(activePointers.size>1){ beginPinch(); return; }
    camera.classList.remove('dragging');
    if(endedGesture?.mode==='pan' && endedGesture.moved){
      cameraState.vx=clamp(endedGesture.velocityX*.55,-14,14);
      cameraState.vy=clamp(endedGesture.velocityY*.55,-14,14);
    }
    gesture=null;
    constrainCameraTarget(false);
    requestCamera();
    clearTimeout(magnetTimer);
    magnetTimer=setTimeout(applyMagnetism,260);
    if(playing) interactionResumeTimer=setTimeout(startSequence,5500);
  }
  camera.addEventListener('pointerup',endPointer);
  camera.addEventListener('pointercancel',endPointer);

  camera.addEventListener('wheel',e=>{
    if(!body.classList.contains('entered')) return;
    e.preventDefault();
    beginWheelInteraction();
    const modeScale=e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1;
    const dy=clamp(e.deltaY*modeScale,-110,110);
    const now=performance.now();
    const elapsed=Math.max(8,now-(wheelMotion.lastTime||now));
    wheelMotion.velocity=wheelMotion.velocity*.62+(dy/elapsed*16)*.38;
    wheelMotion.lastTime=now;
    const zoomFactor=Math.exp(-dy*.0016*zoomResistance(cameraState.targetScale,dy));
    const limits=getScaleLimits();
    const oldScale=cameraState.targetScale;
    const nextScale=clamp(oldScale*zoomFactor,limits.min,limits.max);
    if(Math.abs(nextScale-oldScale)<.0001) return;
    const rect=camera.getBoundingClientRect();
    const px=e.clientX-(rect.left+rect.width/2);
    const py=e.clientY-(rect.top+rect.height/2);
    wheelMotion.anchorX=px;
    wheelMotion.anchorY=py;
    wheelMotion.worldX=(px-cameraState.targetX)/oldScale;
    wheelMotion.worldY=(py-cameraState.targetY)/oldScale;
    const ratio=nextScale/oldScale;
    cameraState.targetX=px-(px-cameraState.targetX)*ratio;
    cameraState.targetY=py-(py-cameraState.targetY)*ratio;
    cameraState.targetScale=nextScale;
    constrainCameraTarget(false);
    requestCamera();
  },{passive:false});

  window.addEventListener('resize',()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      cacheNodeGeometry();
      if(body.classList.contains('entered') && isGuidedCamera()) fitPhaseToViewport(currentPhase);
      else{ constrainCameraTarget(false); requestCamera(); }
    },160);
  });

  cacheNodeGeometry();
  resetCamera();

  function buildSearch(query=''){
    const q=query.trim().toLowerCase();
    const rows=[];
    Object.entries(DATA.functions).forEach(([key,fn]) => {
      if(!q || `${fn.name} ${fn.thesis} ${fn.destination}`.toLowerCase().includes(q)) rows.push({type:'Function',key,title:fn.name,sub:fn.thesis,icon:fn.icon});
      fn.missions.forEach((m,index) => { if(q && `${m.name} ${m.phase} ${m.owner} ${m.problem}`.toLowerCase().includes(q)) rows.push({type:'Mission',key,index,title:m.name,sub:`${fn.name} · ${m.phase}`,icon:fn.icon}); });
    });
    const container=searchPanel.querySelector('.search-results');
    container.innerHTML = rows.slice(0,14).map((r,i)=>`<button class="search-result" type="button" data-result="${i}"><img src="${r.icon}" alt=""><span><strong>${escapeHTML(r.title)}</strong><small>${escapeHTML(r.sub)}</small></span><em>${r.type}</em></button>`).join('');
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

  function applyMissionDocument(document){
    if(!document || !Array.isArray(document.missions)) return;
    missionRevision=document.revision || 0;
    Object.keys(DATA.functions).forEach(key=>{ DATA.functions[key].missions=[]; });
    document.missions.filter(mission=>!mission.archived && DATA.functions[mission.functionKey]).forEach(mission=>DATA.functions[mission.functionKey].missions.push(mission));
    if(activeFunction) openFunction(activeFunction);
  }

  async function refreshMissions(includeArchived=false){
    const response=await fetch(`/api/missions${includeArchived?'?archived=1':''}`,{credentials:'same-origin'});
    if(!response.ok) throw new Error('Missions could not be loaded.');
    const document=await response.json();
    applyMissionDocument(document);
    return document;
  }

  const editor=document.querySelector('.mission-editor');
  const missionForm=document.querySelector('.mission-form');
  const formMessage=document.querySelector('.mission-form-message');
  function findMission(id){
    for(const [functionKey,fn] of Object.entries(DATA.functions)){
      const mission=fn.missions.find(item=>item.id===id);
      if(mission) return {...mission,functionKey};
    }
    return null;
  }
  function openMissionEditor(mission=null){
    if(!editorEnabled) return;
    const defaultFunction=mission?.functionKey || activeFunction || 'sales';
    missionForm.reset();
    missionForm.elements.id.value=mission?.id || '';
    missionForm.elements.name.value=mission?.name || '';
    missionForm.elements.functionKey.value=defaultFunction;
    missionForm.elements.phase.value=mission?.phase || 'Observe';
    missionForm.elements.owner.value=mission?.owner || '';
    missionForm.elements.status.value=mission?.status || 'Not started';
    missionForm.elements.problem.value=mission?.problem || '';
    missionForm.elements.deliverable.value=mission?.deliverable || '';
    missionForm.elements.proof.value=mission?.proof || '';
    missionForm.querySelector('.mission-form-head h2').textContent=mission?'Edit mission':'Add mission';
    missionForm.querySelector('.mission-save').textContent=mission?'Save changes':'Add mission';
    missionForm.querySelector('.mission-archive').hidden=!mission;
    formMessage.textContent='';
    editor.classList.add('open');
    editor.setAttribute('aria-hidden','false');
    setTimeout(()=>missionForm.elements.name.focus(),60);
  }
  function closeMissionEditor(){ editor.classList.remove('open'); editor.setAttribute('aria-hidden','true'); }
  async function mutateMission(method,payload){
    const response=await fetch('/api/missions',{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:missionRevision,...payload})});
    const data=await response.json();
    if(response.status===401){ location.href='/edit'; throw new Error('Please sign in again.'); }
    if(!response.ok) throw new Error(data.error || 'The mission could not be saved.');
    applyMissionDocument(data);
    return data;
  }
  async function enableEditor(){
    const session=await fetch('/api/auth/session',{credentials:'same-origin'}).then(response=>response.json());
    if(!session.authenticated){ location.replace('/edit'); return; }
    editorEnabled=true;
    body.classList.add('edit-mode');
    missionForm.elements.functionKey.innerHTML=Object.entries(DATA.functions).map(([key,fn])=>`<option value="${key}">${escapeHTML(fn.name)}</option>`).join('');
    missionForm.elements.phase.innerHTML=Object.values(DATA.phases).map(phase=>`<option>${escapeHTML(phase.name)}</option>`).join('');
    await refreshMissions(true);
  }
  document.querySelector('.mission-add').addEventListener('click',()=>openMissionEditor());
  document.querySelector('.mission-edit').addEventListener('click',()=>openMissionEditor(findMission(activeMissionId)));
  document.querySelector('.mission-form-close').addEventListener('click',closeMissionEditor);
  editor.addEventListener('click',event=>{if(event.target===editor)closeMissionEditor();});
  missionForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const save=missionForm.querySelector('.mission-save');
    save.disabled=true; formMessage.textContent='Saving…';
    try{
      const values=Object.fromEntries(new FormData(missionForm));
      const id=values.id; delete values.id;
      await mutateMission(id?'PATCH':'POST',id?{id,mission:values}:{mission:values});
      closeMissionEditor();
      if(activeFunction) openFunction(activeFunction);
    }catch(error){formMessage.textContent=error.message;}
    finally{save.disabled=false;}
  });
  missionForm.querySelector('.mission-archive').addEventListener('click',async()=>{
    const id=missionForm.elements.id.value;
    if(!id || !window.confirm('Archive this mission? It will leave the public system but remain stored.')) return;
    formMessage.textContent='Archiving…';
    try{await mutateMission('DELETE',{id}); closeMissionEditor(); closeMission(); if(activeFunction)openFunction(activeFunction);}
    catch(error){formMessage.textContent=error.message;}
  });
  document.querySelector('.editor-logout').addEventListener('click',async()=>{
    await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});
    location.href='/';
  });

  refreshMissions().catch(()=>{});
  if(new URLSearchParams(location.search).get('edit')==='1') enableEditor().catch(()=>location.replace('/edit'));
  setPhase('observe');
})();
