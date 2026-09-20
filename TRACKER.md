# Tracker

Single source of truth for progress. Read this first in every session. Scope for each PR is in `PLAN.md` (section 4).

**Next up: PR 2** (Schema v2 and migration). Written in TypeScript.

Status values: `todo` | `doing` | `review` (PR open, waiting on the human) | `merged` | `skipped`

## Decisions (confirmed by the human 2026-09-21 unless marked default or pending)

- D1 Initialise git in PR 0. (confirmed)
- D2 Species shows only on the mid tier. Sprout and tree look the same for every species. (confirmed for now; the human wants species independent of size LATER, i.e. species on every tier, which would extend PRs 13-16)
- D3 Fallback rejudge merges roots (keep existing, add new, update `w`). It never removes a link. (confirmed)
- D4 Note dialog allows edit and delete (PR 29 read, PR 29a edit and delete). Edit replaces the edited note's own roots. (confirmed; the edit-replaces-roots detail is my default)
- D5 Pan and zoom use `d3-zoom`. Pan and zoom are in PR 8 regardless. (confirmed)
- D6 Milestone M6 (PRs 26-27) is optional and safe to cut. (confirmed)
- D7 Jev candidate pre-filter comes right after PR 12 (row 12a). (default, not answered)
- D8 TypeScript (strict) instead of plain JS, set up first as PR 0a. (confirmed 2026-09-21)
- Fixed: 2D, PixiJS v8 for drawing, no Three.js, top-down oblique, fixed layout where planted, seeded variety only, audio and `genVersion` policy deferred.

## PRs

| # | Title | Status | Branch / PR link | Notes |
|---|---|---|---|---|
| 0 | Baseline repo | review | `pr-00-baseline-repo` (local, no remote) | |
| 0a | TypeScript setup | merged | `pr-0a-typescript-setup`, https://github.com/ujjwalgoyal19/notes-garden-poc/pull/2 | |
| 1 | PRNG and tier rule | review | `pr-01-prng-tier` (local, PR not opened) | The old plain-JS attempt is still in `git stash`; it is superseded, drop it. |
| 2 | Schema v2 and migration | todo | | |
| 3 | Graph helpers | todo | | |
| 4 | Jev resilience | todo | | |
| 5 | Silent rejudge | todo | | |
| 6 | Dev tooling (`?demo`, `?perf`) | todo | | |
| 7 | Pixi app | todo | | |
| 8 | Camera | todo | | |
| 9 | Plants as placeholders | todo | | |
| 10 | Roots, static layer | todo | | |
| 11 | Zoom detail tiers | todo | | |
| 12 | Parity and switch | todo | | |
| 12a | Jev candidate pre-filter | todo | | Not scoped in PLAN.md yet. Scope it when reached. |
| 13 | Generator infra, sprout, tree | todo | | |
| 14 | Flower and mushroom | todo | | |
| 15 | Fern and cactus | todo | | |
| 16 | Wire plants | todo | | |
| 17 | Rules v1 | todo | | |
| 18 | Connected cues | todo | | |
| 19 | Growth | todo | | |
| 20 | Idle sway | todo | | |
| 21 | Root growth | todo | | |
| 22 | Pulse and hover | todo | | |
| 23 | Planting timeline | todo | | |
| 24 | Watering FX | todo | | |
| 25 | Replant crossfade | todo | | |
| 26 | Ground (optional) | todo | | |
| 27 | Time of day and fireflies (optional) | todo | | |
| 28 | Accessible note list | todo | | |
| 29 | Note dialog (read) | todo | | |
| 29a | Edit and delete | todo | | |
| 30 | Quality tiers | todo | | |
| 31 | Perf record and README | todo | | |

## Handoff notes

Append one entry per finished PR, newest last, at most 3 lines. Record only what a future PR needs and cannot
see in the code: deviations from the plan, names or file paths later PRs rely on, gotchas, measured numbers.

Format: `PR N: <what future PRs must know>`

PR 0: Repo has no remote. Default branch is `main`, created empty; PR 0's commit lives only on `pr-00-baseline-repo`, so merge it into `main` before branching PR 1.
PR 0: `.env.example` is tracked; `.env`, `dist`, `node_modules` are ignored (verified with `git check-ignore`).
PR 0a: TypeScript 7 (native `tsc`). `node --test` runs `.ts` tests with no flags on Node 26 (verified with a probe), so PR 1 needs only `"test": "node --test"`; older Node needs type stripping.
PR 0a: `Note` in `src/types.ts` is today's shape; PR 2 replaces it. Not verified in a browser (extension was not connected): only typecheck and build were run.
PR 1: Added `@types/node` (human approved) and `"node"` in tsconfig `types`, so test files are typechecked by `tsc` and the editor.
PR 1: `hash32`/`mulberry32` in `src/domain/prng.ts`, `tierOf`/`Tier` in `src/domain/rules.ts`. Import with the `.ts` extension. Not checked in a browser (only typecheck, build, 3 tests); `App.tsx` change is a straight swap to `tierOf`.
