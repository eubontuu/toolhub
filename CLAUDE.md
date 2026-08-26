# CLAUDE.md — ToolHub project instructions

This file is auto-loaded by Claude Code at the start of every session in this repo. Read `README.md` first for full architecture/mechanics — this file only holds operational context and behavior rules that aren't in the README.

## What this is
- Personal PWA hub of mini-tools for the owner (Thai-speaking). No framework, no build step, no backend.
- Live: https://eubontuu.github.io/toolhub/ — Repo: https://github.com/eubontuu/toolhub (GitHub user `eubontuu`) — deploys from `main` on push.
- Files: `index.html`, `app.js` (shell/router only), `tools/*.js` (one file per tool), `style.css` (all styling), `sw.js` (service worker), `manifest.json`, `icons/`.

## File section map (avoid reading the whole file)
`app.js` was split (2026-08) into a small shell file plus one file per tool under `tools/` — each is small enough to `Read` whole when you touch it, so you should almost never need to read more than the one file you're editing. `style.css` (~1200 lines) is still a single file; before editing it, `Grep` for the selector you need or jump to its line range below with `Read(offset, limit)`.

`app.js` (~95 lines): APPS registry, router (`render`/`renderHome`/`renderToolShell`), boot. No tool logic lives here.

`tools/*.js` — one file per tool/sub-game, loaded in this order in `index.html` (order matters: no bundler, no modules, everything is global scope):
```
tools/counter.js              บวก/ลบ — standalone
tools/wonglao-core.js         วงเหล้า shared state (WONGLAO_DEFAULT_STATE), menu/dispatcher, สุ่มคน, shuffleArray() util — load first, other wonglao-*.js depend on it
tools/wonglao-ohana.js        ไพ่ Ohana
tools/wonglao-randomcard.js   ไพ่สุ่ม (biggest sub-game file)
tools/wonglao-wheel.js        วงล้อ
tools/wonglao-chwazi.js       Chwazi
tools/wonglao-quiz.js         Flash Quiz — uses shuffleArray from wonglao-core.js
tools/hikeprep.js             เตรียมเดินป่า (incl. HIKE_DAYS schedule array) — standalone
tools/changelog.js            การอัปเดต (changelog) — CHANGELOG_DATA + renderChangelog — standalone
```

`style.css`:
```
34    /* Home screen */
113   /* Tool screen (generic) */
155   /* Counter tool */
265   /* วงเหล้า tool (shared/menu) */
326   /* random picker (สุ่มคน) */
395   /* ไพ่ Ohana */
533   /* ไพ่สุ่ม */
694   /* วงล้อ */
786   /* Chwazi */
841   /* Flash Quiz */
883   /* เตรียมเดินป่า */
```
(Line numbers drift as the files grow — re-`Grep` for `^// ----------` / `^/\* ---` if a range looks off.)

## Token-efficiency habits for sessions in this repo
- Don't `Read` `style.css` in full to "get oriented" — use the section map above, or `Grep` for the specific selector involved in the task. For `app.js`/`tools/*.js`, just `Read` the one file the task touches — they're small now.
- After an `Edit`, don't re-`Read` the file to confirm — the tool already errors if the match failed.
- When testing in the browser, prefer `get_page_text`/targeted `find` over full-page screenshots when text content (not visual layout) is what's being checked; use screenshots only for actual visual/layout verification.
- Keep long pasted content (routine prompts, schedule tables, JSON bodies) in a scratch file and reference it, rather than pasting it inline in chat more than once.
- Prefer one `Grep`/`Read` with a tight scope over multiple exploratory reads — if unsure where something lives, one `Grep` across the file usually finds it faster than reading sections speculatively.

## Rules for working in this repo
- **Always bump `CACHE_VERSION` in `sw.js`** when shipping any change to `app.js`/`tools/*.js`/`style.css`/`index.html`/`manifest.json`. Without it, installed PWA clients won't see the update. Format: plain `"vN"`, increment N.
- **Add a `CHANGELOG_DATA` entry in `tools/changelog.js`** (push a new object onto the *front* of the array) for any change the owner would notice or care about — new feature, visible fix, something removed. Write it in Thai, keep it to 1-2 short bullets, categorize each as `added`/`changed`/`removed`. By convention `version` echoes the `CACHE_VERSION` you're bumping in the same change. Skip purely internal refactors/doc updates unless worth mentioning for transparency (see README's "การอัปเดต" section).
- **New `tools/*.js` file → also add it to `PRECACHE_URLS` in `sw.js` and to `index.html`'s script tags** (before the `app.js` tag). Forgetting either means the file loads fine online (fetched lazily) but isn't available offline on first load / isn't in the dependency chain `APPS` expects.
- **All user-facing text is Thai.** Keep new UI strings in Thai unless told otherwise.
- **No test suite.** Verify changes manually via local server (`python -m http.server 8080`) + browser automation (`mcp__claude-in-chrome__*`) before calling something done. For UI changes, actually click through the feature.
- **New top-level tool** → create `tools/yourtool.js` with `renderYourTool(container)`, register its `<script>` tag in `index.html` before `app.js`, add an entry to the `APPS` array in `app.js`, add a CSS section, add to `PRECACHE_URLS`. See README's "Architecture" section for the full contract.
- **New วงเหล้า sub-game** → add to `WONGLAO_TABS` and `WONGLAO_DEFAULT_STATE` (both in `tools/wonglao-core.js`), add a dispatch branch in `renderWongLaoGame` (also `wonglao-core.js`), write the render function (inline in `wonglao-core.js` if small, else its own `tools/wonglao-yourgame.js` registered like any tool file).
- **localStorage state**: any new persisted field must be added to that tool's default-state object. `loadWongLaoState()` (in `tools/wonglao-core.js`) merges `{...WONGLAO_DEFAULT_STATE, ...saved}` — never bypass this merge or old installs get `undefined` fields (this caused a real bug once, see README).
- **Fullscreen reveal overlays** (Ohana/ไพ่สุ่ม/วงล้อ style): use the forced-reflow trigger (`void overlay.offsetHeight; overlay.classList.add("show")`), not double-`requestAnimationFrame` — rAF proved unreliable in this environment. Copy an existing `show*Overlay` function.
- **Flex layout chain** (`#app → .tool-screen → .tool-body → tool wrapper`): every link needs `min-height: 0` alongside `flex:1; display:flex; flex-direction:column`, or content-less children collapse to zero height.
- Before `git push`, if rejected as non-fast-forward, another concurrent session may be editing this same repo on the same GitHub account — `git fetch` + inspect `git log HEAD..origin/main` before merging, don't just force-push.
- Don't reintroduce Web Push (VAPID/push subscriptions) — it was tried and abandoned because the cloud routine sandbox blocks `web.push.apple.com` egress. The daily hiking-prep reminder now goes through Claude's own `PushNotification` tool instead. If you see leftover references to it anywhere, they're stale.

## External state not in this repo
- A scheduled Claude Code routine (trigger id `trig_01AuHV3Bt8XtvCGfFVgbThcc`, "แจ้งเตือนเตรียมเดินป่ารายวัน") fires daily at 00:00 Thai time and sends a `PushNotification` reminder for the hiking-prep schedule. It has its **own copy** of the day-by-day table that must be manually kept in sync with `HIKE_DAYS` in `tools/hikeprep.js` if the schedule changes — there's no automated link. Manage it via the Claude routines API (`RemoteTrigger` tool) or https://claude.ai/code/routines (routines can't be deleted via API).
