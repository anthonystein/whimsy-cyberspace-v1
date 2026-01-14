const field = document.getElementById("field");
const overlay = document.getElementById("overlay");
const overlayName = document.getElementById("overlayName");
const overlayMeta = document.getElementById("overlayMeta");
const overlayBody = document.getElementById("overlayBody");
const closeOverlay = document.getElementById("closeOverlay");
const toggleHush = document.getElementById("toggleHush");
const microHint = document.getElementById("microHint");

const CONTACT_EMAIL = "admin@whimsycyberspace.com";

// Enter-cycle state
let cycleIndex = -1;

function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
}

function getObjectButtons() {
  return Array.from(field.querySelectorAll(".object"));
}

function focusObject(btn) {
  btn.focus({ preventScroll: true });
  btn.classList.add("pulse");
  setTimeout(() => btn.classList.remove("pulse"), 220);
}

function wireMailtoLinks(rootEl) {
  rootEl.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.location.href = a.getAttribute("href");
    });
  });
}

/**
 * Broadway zoom/pan/drag
 * - hover: zoom in + cover + pan toward cursor
 * - touch: first tap zooms, then drag pans
 */
function wireBroadwayZoom(rootEl) {
  const frame = rootEl.querySelector(".broadwayFrame");
  const img = rootEl.querySelector(".broadwayImg");
  if (!frame || !img) return;

  let scale = 1.65; // tweak 1.5–2.0 if you want
  let tx = 0;
  let ty = 0;

  let isZoomed = false;
  let isDragging = false;

  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartTx = 0;
  let dragStartTy = 0;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setVars() {
    img.style.setProperty("--s", String(isZoomed ? scale : 1));
    img.style.setProperty("--tx", `${isZoomed ? tx : 0}px`);
    img.style.setProperty("--ty", `${isZoomed ? ty : 0}px`);
    if (isZoomed) frame.classList.add("is-zoomed");
    else frame.classList.remove("is-zoomed");
  }

  function bounds() {
    const r = frame.getBoundingClientRect();
    const maxX = ((scale - 1) * r.width) / 2;
    const maxY = ((scale - 1) * r.height) / 2;
    return { r, maxX, maxY };
  }

  function panTowardPointer(clientX, clientY) {
    if (!isZoomed || isDragging) return;

    const { r, maxX, maxY } = bounds();
    const px = (clientX - r.left) / r.width;
    const py = (clientY - r.top) / r.height;

    const targetX = (0.5 - px) * 2 * maxX;
    const targetY = (0.5 - py) * 2 * maxY;

    tx = tx + (targetX - tx) * 0.18;
    ty = ty + (targetY - ty) * 0.18;

    tx = clamp(tx, -maxX, maxX);
    ty = clamp(ty, -maxY, maxY);

    setVars();
  }

  function zoomOn() {
    isZoomed = true;
    setVars();
  }

  function zoomOff() {
    isZoomed = false;
    isDragging = false;
    tx = 0;
    ty = 0;
    setVars();
  }

  // Desktop hover behavior
  frame.addEventListener("mouseenter", () => {
    if (!isTouchDevice()) zoomOn();
  });
  frame.addEventListener("mouseleave", () => {
    if (!isTouchDevice()) zoomOff();
  });

  // Desktop mouse move
  frame.addEventListener("mousemove", (e) => {
    if (!isTouchDevice()) panTowardPointer(e.clientX, e.clientY);
  });

  // Touch: tap toggles zoom
  frame.addEventListener("click", () => {
    if (!isTouchDevice()) return;
    isZoomed = !isZoomed;
    if (!isZoomed) {
      tx = 0;
      ty = 0;
    }
    setVars();
  });

  // Drag (mouse + touch via pointer events)
  function onPointerDown(e) {
    if (!isZoomed) return;
    isDragging = true;
    frame.setPointerCapture(e.pointerId);

    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartTx = tx;
    dragStartTy = ty;
  }

  function onPointerMove(e) {
    if (!isZoomed) return;

    if (isDragging) {
      const { maxX, maxY } = bounds();
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      tx = dragStartTx + dx;
      ty = dragStartTy + dy;

      tx = clamp(tx, -maxX, maxX);
      ty = clamp(ty, -maxY, maxY);
      setVars();
    } else {
      panTowardPointer(e.clientX, e.clientY);
    }
  }

  function onPointerUp(e) {
    if (!isZoomed) return;
    isDragging = false;
    try { frame.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  frame.addEventListener("pointerdown", onPointerDown);
  frame.addEventListener("pointermove", onPointerMove);
  frame.addEventListener("pointerup", onPointerUp);
  frame.addEventListener("pointercancel", onPointerUp);

  setVars();
}

const OBJECTS = [
  {
    key: "infinite_hotel",
    title: "The Infinite Hotel",
    meta: "fiction · a structure you enter",
    weight: 63,
    overlayMeta:
      "A fiction book built as a place: floors, thresholds, and conditions. Less a plot-summary, more a machine for perspective.",
    body: `
      <div class="tag"><span class="spark" aria-hidden="true"></span>fiction / structure</div>

      <p class="block">
        The Infinite Hotel is not a story about choice. It’s a place where choice has already been made, and examined.
      </p>

      <p>
        Each floor presents a condition. Each condition reveals a tension:
        comfort and avoidance, endurance and perception, restraint and release.
        Nothing is metaphorical by accident.
      </p>

      <p class="block">
        The Hotel doesn’t test its guests. It reflects them.
      </p>

      <p class="small">
        Status: in progress. Later this year it will be released independently via Amazon KDP.
      </p>
    `,
  },
  // Replace ONLY this Broadway object inside OBJECTS (the one with key: "broadway")
{
  key: "broadway",
  title: "Broadway",
  meta: "a singular artifact · offers start at $27,000",
  weight: 92,
  overlayMeta:
    "One-of-one mixed media painting created in April 2024. Includes an accompanying archive that transfers with the artwork.",
  body: `
    <div class="tag"><span class="spark" aria-hidden="true"></span>artifact / archive</div>

    <div class="broadwayMedia" aria-label="Broadway painting">
      <div class="broadwayFrame" aria-label="Tap to zoom. Drag to pan.">
        <img
          class="broadwayImg"
          src="/assets/broadwayH.PNG"
          alt="Broadway (mixed media on canvas)"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>

    <p class="block">
      Broadway is a one-of-one mixed media painting created in April 2024.
    </p>

    <p>
      It was made late at night inside the back warehouse of a functioning paint store. Concrete floors. Fluorescent light. Inventory stacked around the edges.
      The materials used were the materials available at the time: red wine, limewash, and architectural paints pulled directly from the artist’s daily working environment.
    </p>

    <p>
      The painting is signed and exists as a single physical object. No reproductions or editions exist.
    </p>

    <p class="block">
      In addition to the canvas, Broadway includes a complete accompanying archive. This archive transfers with the artwork and is considered part of the piece itself.
    </p>

    <div class="callout">
      <div><strong>What the purchaser receives:</strong></div>
      <div class="small" style="margin-top:8px; line-height:1.6;">
        • The original painting, signed<br/>
        • The only surviving files of the deleted audio project ALL<br/>
        • Three-angle video documentation of the painting’s creation<br/>
        • A full provenance record<br/>
        • A certificate of authenticity<br/>
        • Valuation documentation<br/>
        • Care and handling guidelines
      </div>
    </div>

    <p class="small">
      The audio files and footage exist solely in relation to this work. They are not available elsewhere.
    </p>

    <p class="small">
      Broadway is offered directly from the artist’s personal archive.
    </p>

    <div class="callout">
      <div><strong>Offers start at $27,000.</strong></div>
      <div class="small">
        For inquiries:
        <a class="mailto" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
      </div>
    </div>
  `,
},

  {
    key: "perspective_philosophy",
    title: "Perspective Philosophy",
    meta: "non-fiction · 300 questions from 1,095 days",
    weight: 72,
    overlayMeta:
      "Derived from daily writing over a closed three-year cycle. Curated into 300 questions, grounded in lived time.",
    body: `
      <div class="tag"><span class="spark" aria-hidden="true"></span>non-fiction / mirror</div>

      <p class="block">
        Perspective Philosophy is derived from <strong>1,095 consecutive days</strong> of lived writing.
        From that archive, <strong>300 questions</strong> are distilled: not chronologically, but by weight.
      </p>

      <p>
        Each question is meant to be a coordinate: not instruction, not advice, just a mirror.
        The reader is never asked to perform. Only to notice.
      </p>

      <p class="block">
        Authorship is attributed, where necessary, to <strong>David Bacchus</strong>.
      </p>

      <p class="small">
        Status: in progress. Later this year it will be released independently via Amazon KDP.
      </p>
    `,
  },
  {
    key: "admin",
    title: "Administrative",
    meta: "correspondence · quiet operations",
    weight: 35,
    overlayMeta:
      "Whimsy Cyberspace is presented as a world. Operational reality exists quietly beneath it.",
    body: `
      <div class="tag"><span class="spark" aria-hidden="true"></span>quiet operations</div>

      <p class="block">
        Whimsy Cyberspace is a world first.
        Business language stays in the background unless it’s necessary.
      </p>

      <p class="small">
        Correspondence: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
      </p>
    `,
  },
];

function seededNoise(seed) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function buildField() {
  field.innerHTML = "";

  const rect = field.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const stacked = window.innerWidth <= 720;
  const padX = 20;
  const padY = 20;

  const centerBias = (weight) => clamp(weight / 100, 0.15, 0.92);

  OBJECTS.forEach((obj, i) => {
    const btn = document.createElement("button");
    btn.className = "object";
    btn.type = "button";
    btn.dataset.key = obj.key;

    btn.style.setProperty("--w", `${clamp(obj.weight, 18, 96)}%`);

    const title = document.createElement("span");
    title.className = "objTitle";
    title.textContent = obj.title;

    const meta = document.createElement("span");
    meta.className = "objMeta";
    meta.textContent = obj.meta;

    const weightRow = document.createElement("div");
    weightRow.className = "objWeight";
    weightRow.innerHTML = `
      <span>weight</span>
      <div class="weightBar" aria-hidden="true"><div class="weightFill"></div></div>
    `;

    btn.appendChild(title);
    btn.appendChild(meta);
    btn.appendChild(weightRow);

    if (!stacked) {
      const rng = seededNoise((i + 1) * 1337 + Math.floor(w) * 7 + Math.floor(h) * 11);

      const bias = centerBias(obj.weight);
      const xRaw = rng();
      const yRaw = rng();

      const xCenterPull = (xRaw - 0.5) * (1 - bias);
      const yCenterPull = (yRaw - 0.5) * (1 - bias);

      const x = (0.5 + xCenterPull) * (w - padX * 2) + padX;
      const y = (0.5 + yCenterPull) * (h - padY * 2) + padY;

      const jitterX = (rng() - 0.5) * 180;
      const jitterY = (rng() - 0.5) * 140;

      const left = clamp(x + jitterX, padX, w - padX - 220);
      const top = clamp(y + jitterY, padY, h - padY - 110);

      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
    }

    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      btn.style.setProperty("--mx", `${mx}%`);
      btn.style.setProperty("--my", `${my}%`);
    });

    btn.addEventListener("click", () => openRoom(obj.key));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") openRoom(obj.key);
    });

    field.appendChild(btn);
  });
}

function openRoom(key) {
  const obj = OBJECTS.find((o) => o.key === key);
  if (!obj) return;

  overlayName.textContent = obj.title.toUpperCase();
  overlayMeta.textContent = obj.overlayMeta;
  overlayBody.innerHTML = obj.body;

  queueMicrotask(() => {
    wireMailtoLinks(overlayBody);

    const broadway = overlayBody.querySelector(".broadwayMedia");
    if (broadway) wireBroadwayZoom(broadway);
  });

  overlay.dataset.open = "true";
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const idx = OBJECTS.findIndex((o) => o.key === key);
  if (idx >= 0) cycleIndex = idx;

  closeOverlay.focus();
}

function closeRoom() {
  overlay.dataset.open = "false";
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

closeOverlay.addEventListener("click", closeRoom);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeRoom();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (overlay.dataset.open === "true") closeRoom();
    cycleIndex = -1;
    return;
  }

  if (e.key === "Enter") {
    if (overlay.dataset.open === "true") {
      const next = (cycleIndex + 1) % OBJECTS.length;
      cycleIndex = next;
      openRoom(OBJECTS[cycleIndex].key);
      return;
    }

    const buttons = getObjectButtons();
    if (!buttons.length) return;

    cycleIndex = (cycleIndex + 1) % buttons.length;

    const btn = buttons[cycleIndex];
    focusObject(btn);
    openRoom(btn.dataset.key);
  }
});

toggleHush.addEventListener("click", () => {
  const hush = document.body.getAttribute("data-hush") === "true";
  document.body.setAttribute("data-hush", String(!hush));
  toggleHush.textContent = hush ? "hush" : "speak";
});

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildField, 120);
});

// Mobile: tap hint to step in / cycle
if (microHint && isTouchDevice()) {
  microHint.style.cursor = "pointer";
  microHint.title = "Tap to step in";
  microHint.innerHTML = `<span class="microKey">tap</span> to step in · <span class="microKey">tap again</span> to cycle`;

  microHint.addEventListener("click", () => {
    if (overlay.dataset.open === "true") {
      const next = (cycleIndex + 1) % OBJECTS.length;
      cycleIndex = next;
      openRoom(OBJECTS[cycleIndex].key);
      return;
    }

    const buttons = getObjectButtons();
    if (!buttons.length) return;

    cycleIndex = (cycleIndex + 1) % buttons.length;
    const btn = buttons[cycleIndex];
    focusObject(btn);
    openRoom(btn.dataset.key);
  });
}

buildField();
