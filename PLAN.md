# Notes Garden: 2D upgrade plan

Status: draft for review (2026-09-20). Nothing here is built yet.
Decisions already made: 2D, PixiJS v8 for drawing (Three.js is not used, see section 1a), top-down oblique view, Obsidian-style pan/zoom with zoom-based detail,
roots always visible (faint, stronger = thicker/brighter), positions fixed where planted, seeded variety only,
Jev fallback then silent rejudge, audio and `genVersion` policy deferred.

## 1. Where the POC is today (read from the code)

| Area | Fact | Consequence |
|---|---|---|
| Stack | Vite 7, React 19, plain JS, no tests, ~200 lines in `src/`. Not a git repo. | Stay JS. Add tests only for pure modules, using built-in `node --test` (no new dependency). |
| Note shape | `{ id, text, x, y, kind, roots: [{ to, w }] }` (`App.jsx:34`). | Needs a seed, timestamps, and a `kindSource`. |
| Positions | `x`, `y` are **screen pixels** (`clientX/Y`, `App.jsx:52`). | Become world coordinates. Old notes are read 1:1 as world coords. |
| IDs | `'n' + Date.now().toString(36)` | `createdAt` can be recovered from old ids. `seed` = hash of id. |
| Tiers | `<60` chars sprout, `<240` species plant, else tree (`App.jsx:7-12`). **Species only shows on the mid tier.** | Six forms: sprout, flower, fern, cactus, mushroom, tree. Keep this rule for the POC. |
| Jev | One call returns `kind` plus `roots` (`jev.js:14`). `w` is already normalised 0..1 above `THRESHOLD = 0.5`. Links stored on the *new* note only. | Degree of an old note needs incoming edges, so a small `graph.js`. |
| Failure | On error the plant stays `kind: 'flower'` with no marker (`App.jsx:40-45`). | Needs `kind: null`, fallback species and rejudge. |
| Scale limit | `MAX_OTHERS = 150` (`jev.js:10`): a new note is only compared with the **150 most recent** notes. | At ~500 notes, older notes can never receive new links. Not in this plan. See section 6. |
| Proxy | Jev goes through a Vite **dev-server** proxy (`vite.config.js`). | Production needs a serverless function. Out of scope, see section 6. |

## 1a. Stack: what each piece is for

| Piece | Version (npm, 2026-09) | Role in this project | Enters in |
|---|---|---|---|
| **PixiJS** (`pixi.js`, MIT) | 8.21.0 | **Draws the garden.** It replaces the SVG paths and emoji `<div>`s of today's `App.jsx`. One GPU canvas holds the ground, plant sprites, root curves, shadows, glow and rain/firefly particles. Reason: 500 plants and 1,500 animated roots as DOM/SVG nodes would be slow. Obsidian's graph view uses the same library. | PR 7 |
| **React 19** (already installed) | ^19 | **The UI around the canvas only:** planting popup, note dialog, accessible note list, hint and error banners. It does not render plants. | already in use |
| **Vite 7** (already installed) | ^7 | Dev server, build, and the Jev dev proxy. Unchanged. | already in use |
| **d3-zoom** (ISC) | 3.0.0 | Pan, zoom and pinch on the canvas. Small and stable. Optional, see Q5. | PR 8 |
| **`node --test`** | built into Node | Unit tests for the pure modules (seeded randomness, rules, graph, timeline). No dependency. | PR 1 |
| **Jev via OpenRouter** (already in use) | n/a | Decides species and which notes connect. Unchanged. | already in use |
| **Three.js: not used** | n/a | It was in the earlier 3D research. You chose 2D, so it is dropped, and so are React Three Fiber and drei. | never |

Where Pixi ends and everything else starts:
- **Pixi draws pixels.** Ground, plants, roots, effects.
- **Your own code decides what to draw:** `domain/` (rules, seeds, timeline) and `gen/` (plant shapes). These never import Pixi, so they can be tested without a browser.
- **React handles anything you read or type:** it sits on top of the canvas as normal HTML, which is also what keeps notes accessible.

## 2. Target structure

```
src/
  domain/   prng.js  rules.js  notes.js  graph.js  timeline.js     (pure, no DOM, no pixi; unit-tested)
  gen/      forms/*.js  paint.js  bake.js                            (forms are pure: seed -> drawing commands)
  scene/    garden.js  camera.js  plants.js  roots.js  lod.js  fx.js  ground.js
  ui/       App.jsx  GardenCanvas.jsx  NoteDialog.jsx  NoteList.jsx
  jev.js  rejudge.js  storage.js
```

Rules of the architecture:
1. `domain/` and `gen/forms/` import nothing from Pixi or React. That is what makes determinism testable.
2. The scene is imperative Pixi. React only renders DOM UI (popup, list, dialog). No per-plant React components.
3. Store to scene sync is by id diff, never a full rebuild.
4. Roots draw into one static Graphics that is redrawn only when links change. Only *growing* roots are redrawn per frame.

### Note schema v2

```js
{ v: 2, id, text, x, y,            // world coords
  seed,                            // uint32, set once at creation, never recomputed
  createdAt,                       // ms; parsed from id for old notes
  kind: null | 'flower'|'fern'|'cactus'|'mushroom',
  kindSource: null | 'jev' | 'fallback',
  judgedAt,                        // ms or null
  roots: [{ to, w }] }             // as today
```

Derived, never stored: tier, size, variant, density bucket, maturity, glow, root curve shape
(seeded from the two ids), screen position.

## 3. Working agreements for every PR

- One concern per PR. Target **<= ~300 changed lines** excluding lockfile. If it is bigger, split it.
- The app builds and runs after every merge. No half-wired features on the default path.
- `npm run build` and `npm test` pass. Visual PRs include a screenshot or short clip. Scene PRs include an FPS number at `?demo=500`.
- No drive-by refactors. Each PR description states: what, why, how to verify, how to roll back.
- The old view stays the default until PR 12, and is deleted in PR 12.

Size key: **S** under ~150 lines, **M** ~150-300.

## 4. The PRs

### M0 Baseline

| # | PR | Scope | Verify | Size |
|---|---|---|---|---|
| 0 | Baseline repo | `git init`, first commit of the current POC, confirm `.env` and `dist` stay ignored. Skip if you already track it somewhere. | `git status` clean, `.env` not tracked. | S |

### M1 Foundations (no visual change)

| # | PR | Scope | Verify | Size |
|---|---|---|---|---|
| 1 | PRNG and tier rule | `domain/prng.js` (`hash32(str)`, `mulberry32(seed)`), `domain/rules.js` with `tierOf(text)` extracted from `App.jsx`. Add `"test": "node --test"`. | Tests: same seed gives the same sequence, tier boundaries at 59/60/239/240. App looks identical. | S |
| 2 | Schema v2 and migration | `domain/notes.js`: `newNote()`, `migrate()`. `storage.load()` migrates old notes: `seed = hash32(id)`, `createdAt` parsed from id, `kindSource` null. | Test with a v1 fixture. Load an existing localStorage garden and nothing changes on screen. | S |
| 3 | Graph helpers | `domain/graph.js`: undirected deduped edges, `degree(id)`, `strengthStats(id)` (max and mean of `w`, counting incoming links). | Unit tests including incoming edges and dangling `to` ids. | S |
| 4 | Jev resilience | `kind` stays `null` until judged. 6 s timeout (AbortController). On failure or timeout set a seeded fallback species and `kindSource: 'fallback'`. Error banner unchanged. | Test the pure fallback picker. Manual: block the network, plant, get a species after 6 s, reload keeps it. | M |
| 5 | Silent rejudge | `rejudge.js`: notes with `kindSource: 'fallback'` retry at +5 s, +30 s, and on next load, then stop. Success sets `kind`, `roots` (merged, see Q3 in section 7), `kindSource: 'jev'`, `judgedAt`. | Test the schedule with a fake clock. Manual: fail then recover. | M |
| 6 | Dev tooling | `?demo=N` deterministic synthetic garden (length mix, species mix, ~3 roots each) and `?perf` FPS overlay. Dev only (`import.meta.env.DEV`). | `?demo=500` loads in the old view. Every later perf check uses it. | S |

### M2 Pixi shell (behind `?view=pixi`; old view stays default)

| # | PR | Scope | Verify | Size |
|---|---|---|---|---|
| 7 | Pixi app | Add `pixi.js`. `scene/garden.js` (init, resize, DPR cap 2, ground gradient), `GardenCanvas.jsx`, flag in `App.jsx`. | Blank ground, resizes cleanly, 60 fps idle. | M |
| 8 | Camera | Pan and zoom (d3-zoom or hand-rolled, see Q5), world container, `camera.js` screen/world math, zoom limits, fit-to-content on load. | Unit tests for the transform. Wheel, drag and pinch work. | M |
| 9 | Plants as placeholders | Discs per tier from the store (id diff), y-sort, ellipse shadows. Tap-to-plant with a tap-versus-pan threshold. Draft popup positioned from world to screen. | Plant, reload, plants persist. A pan drag does not plant. | M |
| 10 | Roots, static layer | One Graphics under the plants. Oblique-projected curves, `w` to width and alpha with a faint floor. Redraw only on link change. | `?demo=500` shows roots at 60 fps. Weak roots faint, strong ones clearly thicker. | M |
| 11 | Zoom detail tiers | Far: dots plus strong roots only. Mid: everything faint. Near: full detail and note labels. Hysteresis at thresholds. Labels via a small pooled DOM layer (cap visible count). | No flicker at thresholds. Far view is cheaper than near, measured. | M |
| 12 | Parity and switch | Pixi becomes default. Delete the SVG/emoji view and its CSS. Keep hint and error UI. | Full plant, water, root flow works. `?demo=500` at or above 60 fps on your laptop. | S |

### M3 Plants (PRs 13-15 depend only on PR 7 and can run in parallel with PRs 8-12)

| # | PR | Scope | Verify | Size |
|---|---|---|---|---|
| 13 | Generator infra, sprout, tree | `gen/`: a form is a pure function `(rng, params) => commands[]`. `paint.js` draws commands into Graphics. `bake.js` caches RenderTextures per `(form, variant, density)`. Dev `?sheet` contact sheet (forms by seeds). | Determinism test: same seed gives the same command hash. Sheet reviewed by eye. | M |
| 14 | Flower and mushroom | Two forms. Flower: curved stem, phyllotaxis leaves, 5-8 petals. Mushroom: bulbous stem, flattened cap, spots. | Contact sheet: each reads as its species in 2 s. | M |
| 15 | Fern and cactus | Fern: arched rachis with tapering pinna pairs. Cactus: ribbed column plus 0-3 elbow arms. | Same test. All six forms recognisable side by side. | M |
| 16 | Wire plants | Variant by seed, per-plant tint, scale and flip, base-anchored sprites replacing discs. | Same note always draws the same plant after reload. | M |
| 17 | Rules v1 | `rules.js` table: length to size (log), age to maturity, degree to density bucket (sparse / normal / lush = 3 baked variants), species palette. | Unit tests per row of the rule table. Visible difference between 0 and 5 connections. | M |
| 18 | Connected cues | Soft additive halo sprite scaled by mean strength, cluster hue drift toward neighbours. Blend-mode use grouped to keep batches. | Well-connected notes stand out with no labels. FPS unchanged at `?demo=500`. | S |

### M4 Motion

| # | PR | Scope | Verify | Size |
|---|---|---|---|---|
| 19 | Growth | `growth` 0..1 from base with ease-out-back. Existing notes load fully grown (no replay). `prefers-reduced-motion` means instant. | New plant grows in about 1-3 s, reload shows no animation. | S |
| 20 | Idle sway | Sine skew per plant, phase from seed. Mid and near tiers only. | No cost in far tier. FPS unchanged. | S |
| 21 | Root growth | Overlay layer for active roots only. Progress reveal along the curve, staggered by strength. Folds into the static layer when done. | New links draw in about 1.2 s. Static layer redraws once, not per frame. | M |
| 22 | Pulse and hover | Water pulse on recent roots. Hover or select brightens that plant's roots and dims the rest. | Selection reads clearly at 500 notes. | M |

### M5 The moment

| # | PR | Scope | Verify | Size |
|---|---|---|---|---|
| 23 | Planting timeline | `domain/timeline.js` state machine: seed, seedling (sprout form), watering (min 1.2 s), species growth, then roots. Consumes the Jev promise. | Fake-clock tests for latency 0 ms, 300 ms, 3 s, and failure (fallback at 6 s). No visual pop when species arrives. | M |
| 24 | Watering FX | Rain streaks, splash ring, sparkle burst using ParticleContainer. About 1.6 s total. Skipped under reduced motion. | Brief, rewarding, no dropped frames. | M |
| 25 | Replant crossfade | If rejudge changes the species, the old plant sinks while the new one grows (about 500 ms). | Scripted species change shows no jump. | S |

### M6 Atmosphere (can be cut without affecting later PRs)

| # | PR | Scope | Verify | Size |
|---|---|---|---|---|
| 26 | Ground | Noise-textured ground, edge vignette, fog tint in the far tier. | Screenshot review. Cost under 1 ms. | S |
| 27 | Time of day and fireflies | Palette tint from local time. Dusk fireflies via ParticleContainer. Off under reduced motion. | Fireflies only at dusk, cheap at 500. | M |

### M7 Access and polish

| # | PR | Scope | Verify | Size |
|---|---|---|---|---|
| 28 | Accessible note list | Visually hidden focusable list of notes, `aria-live` announcements, "Add note" button that places near the focused plant or view centre, focus eases the camera. | Plant, read and navigate with keyboard only. Screen reader announces plant and connection count. | M |
| 29 | Note dialog (read) | Read a note in a real DOM dialog anchored to its plant (focus trap, Esc). Replaces the `title` tooltip. | Keyboard and touch both work. | M |
| 29a | Edit and delete | `domain/notes.js`: `editNote`, `deleteNote`. Edit text in the dialog: tier is re-derived (growth animates if it changes), Jev re-runs, and this note's **own** roots are replaced (user-triggered change of meaning, an exception to the merge rule, which applies to fallback rejudge only). Delete asks to confirm, removes the note and every root pointing to it, and the plant fades out (instant under reduced motion). | Tests: edit re-tiers, delete leaves no dangling `to` ids. Edit and delete persist across reload and work by keyboard. | M |
| 30 | Quality tiers | Sample FPS and drop sway, glow and particles when slow. DPR cap. Touch pinch checked on a phone. | 500 notes at 30 fps or better on a mid-range phone. | S |
| 31 | Perf record and README | Numbers at 500 notes and 1,500 roots on laptop and phone. Fix anything below target. | Numbers written down. Targets met or exceptions listed. | S |

## 5. Order, dependencies, milestones

```
M1 (1..6) -> M2 (7..12) -> M4 (19..22) -> M5 (23..25) -> M7 (28..31)
                 \-> M3 (13..18) ---/           M6 (26,27) can slot in anywhere after 12
```

- After **PR 12** you have the new renderer at parity, on the same behaviour as today.
- After **PR 18** it looks like a garden. After **PR 25** it feels alive. PR 31 is the finish line.
- PRs 13-15 can be reviewed while 8-12 are in flight. Everything else is sequential.
- Roughly 32 PRs, about 3-4k net lines. Each should be reviewable in one sitting.

## 6. Out of scope, deliberately

- **Jev candidate pre-filter.** `MAX_OTHERS = 150` means a note only links to the 150 most recent notes.
  This silently caps the graph around 150 notes even though the target is 500. The fix (an embedding or lexical
  pre-filter, as the comment at `jev.js:10` already notes) is a separate change. I would do it right after PR 12.
- **Deploying the Jev proxy.** The proxy exists only in the Vite dev server. Shipping needs a serverless function, which
  stays within "no backend" in the sense of no accounts or storage, but it is still new code.
- Audio, `genVersion` migration policy, an "arrange by meaning" button, more species: deferred as you asked.

## 7. Questions for you (defaults in bold)

1. Initialise git in this folder? **Yes, PR 0.**
2. Keep "species only shows on the mid tier"? **Yes.** Sprouts and trees look the same for every species. The alternative is a species tint on trees.
3. When rejudge returns, replace a note's roots or merge? **Merge**: keep existing roots, add new ones, update `w`. Replacing makes links vanish under the user.
4. Edit and delete notes in the dialog? **Answered 2026-09-21: yes.** Split into PR 29 (read) and PR 29a (edit and delete).
5. Pan and zoom: `d3-zoom` (a small stable dependency that handles pinch correctly) or hand-rolled? **d3-zoom.**
6. Cut M6 (ground polish, time of day, fireflies) if time is short? **Yes, it is safe to cut.**
7. Do the pre-filter (section 6) right after PR 12, or leave it until you feel the cap? **Right after PR 12.**
