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

## Content editing
All phase, function and mission content lives in `data.js`. Add missions there without changing the layout.

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
