# Whimsy Cyberspace — Living System V4

A no-build-step interactive prototype for the Primetime operating model.

## Open it
Double-click `index.html` or serve the folder with any static web server.

## Asset replacement
The prototype uses lightweight SVG placeholders. You can replace any file with a photo or custom graphic later.

Current asset paths:
- `assets/evidence/store-hero.svg` — opening visual
- `assets/evidence/store-core.svg` — central Primetime node
- `assets/evidence/mission-placeholder.svg` — mission evidence panel
- `assets/icons/sales.svg`
- `assets/icons/marketing.svg`
- `assets/icons/operations.svg`
- `assets/icons/inventory.svg`
- `assets/icons/hr.svg`
- `assets/icons/finance.svg`
- `assets/icons/ecommerce.svg`
- `assets/icons/rnd.svg`

If you want to switch a placeholder from `.svg` to `.jpg` or `.png`, change the matching path in `index.html` or `data.js`.

## Living mission editing
The original missions in `data.js` seed the living system. Public visitors read the current mission document from `/api/missions`; if the API is temporarily unavailable, the original content remains visible.

Administrators visit `/edit`, enter the private passphrase, and edit missions inside the normal function and mission views. The editor supports:

- adding and updating missions;
- title, function, phase, owner, status, problem, deliverable, and evidence fields;
- `Not started`, `In progress`, and `Completed` states;
- archiving without permanently deleting mission history.

Mission data is stored as a private Vercel Blob. Link a private Blob store to the Vercel project, then add these Sensitive environment variables to Production and Preview:

- `WHIMSY_ADMIN_KEY_HASH`
- `WHIMSY_SESSION_SECRET`

Vercel creates `BLOB_READ_WRITE_TOKEN` when the Blob store is connected. Generate the two Whimsy values locally with `pnpm admin-key`; paste only the generated values into Vercel and never commit them.

For local development only, set `WHIMSY_DATA_FILE=.whimsy-local-data.json`. The local file and all `.env` files are ignored by Git.

## Launch checklist
1. Contribution links send mission responses to `admin@whimsycyberspace.com`.
2. Replace evidence assets as real photos/screenshots become available.
3. Test on the deployment domain, mobile Safari, Chrome and Firefox.
4. Keep asset filenames stable if you want future replacements to be drag-and-drop.

## Interaction model
- Intro → cinematic reveal
- Main map → drag / wheel zoom / hover traces
- Phase ribbon → Observe → Capture → Enable → Stabilize → Compound
- Function → thesis, outcome, role in loop, open missions
- Mission → problem, deliverable, evidence
- Search → press `/`

## V4.1 interaction fixes
- Canvas dragging no longer selects node text.
- Trackpad/mouse zoom is slower, cursor-anchored, and eased instead of stepping in large jumps.
- Function and mission panels use contained, smoother scrolling with stable scrollbars.
- Mission "Back to function" control is positioned below the persistent header so it cannot be hidden.

## Living-system update
- Desktop zoom remains continuous during a trackpad gesture, then eases into soft overview (`0.62`), exploration (`0.78`), or focus (`1.02`) resting levels.
- Zoom stays anchored to the cursor and uses a wider safe pan envelope so the anchor is not lost near the viewport edge.
- Mobile camera thresholds and guided node behavior remain unchanged.
- Mission writes require a signed, HTTP-only, same-site session cookie and same-origin JSON requests.
- A revision number plus Blob ETags protects against stale or overlapping saves.
