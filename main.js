// main.js
const field = document.getElementById("field");
const overlay = document.getElementById("overlay");
const overlayName = document.getElementById("overlayName");
const overlayMeta = document.getElementById("overlayMeta");
const overlayBody = document.getElementById("overlayBody");
const closeOverlay = document.getElementById("closeOverlay");
const toggleHush = document.getElementById("toggleHush");
const microHint = document.getElementById("microHint");

const CONTACT_EMAIL = "admin@whimsycyberspace.com";
const YOUTUBE_URL = "https://www.youtube.com/@DavidBacchusX";

// Optional lead capture endpoint (leave blank to disable)
const LEAD_CAPTURE_URL =
  "https://script.google.com/macros/s/AKfycbw7Zg2GY8dQBHRCvT9e-kdQCJ-MsQIUap7ZoU_rTkDZqoIS5ZJwSQvHVROoQD8n9aSFyA/exec";

function leadFormHTML(sourceKey, opts = {}) {
  if (!LEAD_CAPTURE_URL) return "";

  const {
    headline = "Stay close",
    copy = "Quiet correspondence. Only when something becomes real.",
    placeholder = "email",
    button = "enter",
  } = opts;

  return `
    <div class="leadBox" role="group" aria-label="Stay in touch">
      <div class="leadHead">${headline}</div>
      <div class="leadCopy">${copy}</div>

      <form class="leadForm" data-source="${sourceKey}" autocomplete="off">
        <label class="srOnly" for="leadEmail_${sourceKey}">Email</label>
        <input
          id="leadEmail_${sourceKey}"
          class="leadInput"
          name="email"
          type="email"
          inputmode="email"
          placeholder="${placeholder}"
          required
        />
        <button class="leadBtn" type="submit">${button}</button>
      </form>

      <div class="leadStatus" aria-live="polite"></div>
      <div class="leadFine">No spam. No funnels. Just release signals.</div>
    </div>
  `;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

async function submitLead({ email, source }) {
  if (!LEAD_CAPTURE_URL) throw new Error("Lead capture endpoint not configured.");

  const res = await fetch(LEAD_CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      email,
      source,
      createdAt: new Date().toISOString(),
    }),
    redirect: "follow",
  });

  const text = await res.text();

  if (!res.ok) throw new Error(`Request failed (${res.status}): ${text}`);
  if (String(text).trim().toLowerCase() !== "ok") throw new Error(`Unexpected response: ${text}`);

  return text;
}

function wireLeadForms(rootEl) {
  rootEl.querySelectorAll(".leadForm").forEach((form) => {
    const status = form.parentElement?.querySelector(".leadStatus");
    const input = form.querySelector("input[name='email']");
    if (!status || !input) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const email = String(input.value || "").trim();
      const source = form.getAttribute("data-source") || "unknown";

      if (!isValidEmail(email)) {
        status.textContent = "That email looks off.";
        status.setAttribute("data-state", "error");
        return;
      }

      status.textContent = "sending...";
      status.setAttribute("data-state", "pending");

      try {
        await submitLead({ email, source });
        status.textContent = "received.";
        status.setAttribute("data-state", "ok");
        input.value = "";
      } catch (err) {
        console.error("Lead capture error:", err);
        status.textContent = "Not connected yet.";
        status.setAttribute("data-state", "error");
      }
    });
  });
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

function wireExternalLinks(rootEl) {
  rootEl.querySelectorAll('a[data-external="true"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });
}

function wireBroadwayZoom(rootEl) {
  const frame = rootEl.querySelector(".broadwayFrame");
  const img = rootEl.querySelector(".broadwayImg");
  if (!frame || !img) return;

  let scale = 1.65;
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

  function isTouchDevice() {
    return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
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

  frame.addEventListener("mouseenter", () => {
    if (!isTouchDevice()) zoomOn();
  });
  frame.addEventListener("mouseleave", () => {
    if (!isTouchDevice()) zoomOff();
  });

  frame.addEventListener("mousemove", (e) => {
    if (!isTouchDevice()) panTowardPointer(e.clientX, e.clientY);
  });

  frame.addEventListener("click", (e) => {
    if (!isTouchDevice()) return;
    e.stopPropagation();
    isZoomed = !isZoomed;
    if (!isZoomed) {
      tx = 0;
      ty = 0;
    }
    setVars();
  });

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
    try {
      frame.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }

  frame.addEventListener("pointerdown", onPointerDown);
  frame.addEventListener("pointermove", onPointerMove);
  frame.addEventListener("pointerup", onPointerUp);
  frame.addEventListener("pointercancel", onPointerUp);

  setVars();
}

const OBJECTS = [
  {
    key: "broadway",
    title: "Broadway",
    meta: "origin artifact · $27,000",
    weight: 92,
    overlayMeta:
      "One-of-one mixed media painting created in April 2024. An archive transfers with the work.",
    body: `
      <div class="tag"><span class="spark" aria-hidden="true"></span>artifact</div>

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
        Broadway marks the moment expression overtook suppression.
      </p>

      <p>
        Created late at night inside the warehouse of a functioning paint store.
        The materials were not symbolic, they were literal: red wine, mis-tinted limewash, and architectural coatings pulled from the artist’s daily environment.
      </p>

      <p class="block">
        The work includes an accompanying archive that transfers with the artwork.
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

      <div class="callout">
        <div><strong>Offers begin at $27,000 CAD.</strong></div>
        <div class="small">
          Inquiries:
          <a class="mailto" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
        </div>
      </div>

      ${leadFormHTML("broadway", {
        headline: "If Broadway moves",
        copy: "One message when the archive transfers. No noise.",
        placeholder: "email",
        button: "stay close",
      })}
    `,
  },

  {
    key: "admin",
    title: "Administrative",
    meta: "systems · ai · communication",
    weight: 78,
    overlayMeta:
      "Deliberate operations. Helping humans and businesses understand, implement, and refine systems through AI, clarity, and communication.",
    body: `
      <div class="tag"><span class="spark" aria-hidden="true"></span>systems</div>

      <p class="block">
        Administrative is applied clarity.
      </p>

      <p>
        I help individuals and teams:
        <br/>• map what exists
        <br/>• find what breaks
        <br/>• implement systems that hold
        <br/>• use AI to reduce noise without losing intent
      </p>

      <p class="small">
        Private consulting and operations inquiries:
        <a class="mailto" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
      </p>

      ${leadFormHTML("admin", {
        headline: "Administrative notes",
        copy: "Occasional releases, tools, and system drops.",
        placeholder: "email",
        button: "enter",
      })}
    `,
  },

  {
    key: "youtube",
    title: "YouTube",
    meta: "long-form depth",
    weight: 66,
    overlayMeta:
      "Essays on mineral surfaces, authored environments, systems, and perspective.",
    body: `
      <div class="tag"><span class="spark" aria-hidden="true"></span>depth</div>

      <p class="block">
        This is where nuance lives.
      </p>

      <p>
        Long-form essays that connect:
        <br/>• surface and feeling
        <br/>• materials and meaning
        <br/>• systems and identity
      </p>

      <div class="callout">
        <a data-external="true" href="${YOUTUBE_URL}" target="_blank" rel="noopener noreferrer">
          Enter YouTube →
        </a>
      </div>
    `,
  },

  {
    key: "human_texture",
    title: "Human Texture",
    meta: "applied research · life design",
    weight: 88,
    overlayMeta:
      "Mineral finishes, sustainable material systems, Blue Zone longevity research, and modern life architecture.",
    body: `
      <div class="tag"><span class="spark" aria-hidden="true"></span>research</div>

      <p class="block">
        Human Texture began as Sustainable Design R&D.
      </p>

      <p>
        It now integrates:
        <br/>• mineral finishes and surface behavior
        <br/>• sustainable material systems
        <br/>• Blue Zone longevity research
        <br/>• intentional life design
      </p>

      <p>
        The question:
        What happens when space, material, and daily ritual are designed to support presence, longevity, and authorship?
      </p>

      <p class="small">
        Broadway funds the first applied phase.
      </p>

      ${leadFormHTML("human_texture", {
        headline: "Human Texture",
        copy: "When research becomes real, you will know.",
        placeholder: "email",
        button: "stay close",
      })}
    `,
  },
];

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

function openRoom(key) {
  const obj = OBJECTS.find((o) => o.key === key);
  if (!obj) return;

  overlayName.textContent = obj.title.toUpperCase();
  overlayMeta.textContent = obj.overlayMeta;
  overlayBody.innerHTML = obj.body;

  queueMicrotask(() => {
    wireMailtoLinks(overlayBody);
    wireExternalLinks(overlayBody);
    wireLeadForms(overlayBody);

    const broadway = overlayBody.querySelector(".broadwayMedia");
    if (broadway) wireBroadwayZoom(broadway);
  });

  overlay.dataset.open = "true";
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const idx = OBJECTS.findIndex((o) => o.key === key);
  if (idx >= 0) cycleIndex = idx;

  closeOverlay.focus({ preventScroll: true });
}

function closeRoom() {
  overlay.dataset.open = "false";
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
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

    // Defensive: pointerup is more reliable than click in some stacks
    btn.addEventListener("pointerup", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openRoom(obj.key);
    });

    // Also keep click for older browsers
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openRoom(obj.key);
    });

    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        openRoom(obj.key);
      }
    });

    field.appendChild(btn);
  });
}

closeOverlay.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeRoom();
});

// Close only when clicking the backdrop itself, and do not let any inner clicks bubble to it
overlay.addEventListener("pointerup", (e) => {
  if (e.target === overlay) {
    e.preventDefault();
    e.stopPropagation();
    closeRoom();
  }
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

toggleHush.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const hush = document.body.getAttribute("data-hush") === "true";
  document.body.setAttribute("data-hush", String(!hush));
  toggleHush.textContent = hush ? "hush" : "speak";
});

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildField, 120);
});

if (microHint && isTouchDevice()) {
  microHint.style.cursor = "pointer";
  microHint.title = "Tap to step in";
  microHint.innerHTML = `<span class="microKey">tap</span> to step in · <span class="microKey">tap again</span> to cycle`;

  microHint.addEventListener("pointerup", (e) => {
    e.preventDefault();
    e.stopPropagation();

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
