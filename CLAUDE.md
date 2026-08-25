# CLAUDE.md — ToolHub project instructions

This file is auto-loaded by Claude Code at the start of every session in this repo. Read `README.md` first for full architecture/mechanics — this file only holds operational context and behavior rules that aren't in the README.

## What this is
- Personal PWA hub of mini-tools for the owner (Thai-speaking). No framework, no build step, no backend.
- Live: https://eubontuu.github.io/toolhub/ — Repo: https://github.com/eubontuu/toolhub (GitHub user `eubontuu`) — deploys from `main` on push.
- Files: `index.html`, `app.js` (all app logic), `style.css` (all styling), `sw.js` (service worker), `manifest.json`, `icons/`.

## Rules for working in this repo
- **Always bump `CACHE_VERSION` in `sw.js`** when shipping any change to `app.js`/`style.css`/`index.html`/`manifest.json`. Without it, installed PWA clients won't see the update. Format: plain `"vN"`, increment N.
- **All user-facing text is Thai.** Keep new UI strings in Thai unless told otherwise.
- **No test suite.** Verify changes manually via local server (`python -m http.server 8080`) + browser automation (`mcp__claude-in-chrome__*`) before calling something done. For UI changes, actually click through the feature.
- **New top-level tool** → add an entry to the `APPS` array in `app.js`, write `renderYourTool(container)`, add a CSS section. See README's "Architecture" section for the full contract.
- **New วงเหล้า sub-game** → add to `WONGLAO_TABS`, add default fields to `WONGLAO_DEFAULT_STATE`, add a dispatch branch in `renderWongLaoGame`, write the render function.
- **localStorage state**: any new persisted field must be added to that tool's default-state object. `loadWongLaoState()` merges `{...WONGLAO_DEFAULT_STATE, ...saved}` — never bypass this merge or old installs get `undefined` fields (this caused a real bug once, see README).
- **Fullscreen reveal overlays** (Ohana/ไพ่สุ่ม/วงล้อ style): use the forced-reflow trigger (`void overlay.offsetHeight; overlay.classList.add("show")`), not double-`requestAnimationFrame` — rAF proved unreliable in this environment. Copy an existing `show*Overlay` function.
- **Flex layout chain** (`#app → .tool-screen → .tool-body → tool wrapper`): every link needs `min-height: 0` alongside `flex:1; display:flex; flex-direction:column`, or content-less children collapse to zero height.
- Before `git push`, if rejected as non-fast-forward, another concurrent session may be editing this same repo on the same GitHub account — `git fetch` + inspect `git log HEAD..origin/main` before merging, don't just force-push.
- Don't reintroduce Web Push (VAPID/push subscriptions) — it was tried and abandoned because the cloud routine sandbox blocks `web.push.apple.com` egress. The daily hiking-prep reminder now goes through Claude's own `PushNotification` tool instead. If you see leftover references to it anywhere, they're stale.

## External state not in this repo
- A scheduled Claude Code routine (trigger id `trig_01AuHV3Bt8XtvCGfFVgbThcc`, "แจ้งเตือนเตรียมเดินป่ารายวัน") fires daily at 00:00 Thai time and sends a `PushNotification` reminder for the hiking-prep schedule. It has its **own copy** of the day-by-day table that must be manually kept in sync with `HIKE_DAYS` in `app.js` if the schedule changes — there's no automated link. Manage it via the Claude routines API (`RemoteTrigger` tool) or https://claude.ai/code/routines (routines can't be deleted via API).
