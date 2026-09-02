# CLAUDE.md — ToolHub project instructions

Auto-loaded every session in this repo. Read `README.md` for full architecture — this file is operational rules only.

**Keep this file curated, not a running log.** Its length is a cost paid every session. When a rule stops applying or gets superseded, edit/remove it — don't append near-duplicates.

## What this is
- Personal PWA hub of mini-tools for the owner (Thai-speaking). No framework, no build step, no backend.
- Live: https://eubontuu.github.io/toolhub/ — Repo: https://github.com/eubontuu/toolhub (`eubontuu`) — deploys from `main` on push.
- Files: `index.html`, `app.js` (shell/router), `tools/*.js`+`.css` (one pair per tool), `style.css` (shell only), `sw.js`, `manifest.json`, `icons/`.

## คำศัพท์ UI (คุยกับ owner ให้ตรงกัน)
- **แอป** — full-screen tool opened from sidebar, `renderToolShell` header, registered in `APPS`. 7 ตอนนี้: บวก/ลบ, วงเหล้า, หวย, ดูดวง, เกม, สิ่งที่ต้องทำ, เตรียมเดินป่า. ปุ่มย้อนกลับจากแอปไหนก็ตาม → เปิด sidebar ทับหน้าปัจจุบันทันที (ไม่ navigate ไปหน้าแรกก่อน) ไฮไลท์แอปที่เพิ่งออกมา (`openSidebarOverlay()`/`sidebarActiveRoute`, `app.js`).
- **แถบ** — (1) sidebar nav item (`.sidebar-nav-item`) หรือ (2) แท็บเดี่ยวแนวนอนคงที่ในแอปฮับ (วงเหล้า/เกม) — สลับ sub-item ทันที, พับ/กางได้, ล้นแล้วเลื่อนซ้าย-ขวาแทนขึ้นบรรทัดใหม่, และปุ่ม "…ทั้งหมด" ข้างปุ่มพับ/กางเปิด full-screen grid overlay ของทุกแท็บให้กดสลับได้ทันที (`showGameAllOverlay`/`showWongLaoAllOverlay`, `reveal-overlay`, tap-outside ปิด). วงเหล้าใช้ `WONGLAO_TABS`+`renderWongLaoShell` (`wonglao-core.js`); เกม (งู/Jump King/คิดเลขเร็ว/ซูโดกุ/2048) ใช้ `GAME_TABS`+`renderGamesShell` (`games-core.js`) — คนละไฟล์ คนละ state กัน แต่ pattern เดียวกัน.
- **วิดเจ็ต** — ฝังหน้าแรก แก้ไขได้ทันที ไม่ลงทะเบียนใน `APPS`. ตัวอย่าง: `renderQuickStart()` (`quickstart.js`) → `#quickstartContent` — ปักหมุด/เอาออกได้ว่าจะโชว์ทางลัดไปแอปไหนบ้าง (`toolhub.quickstart`, array ของ `APPS` id), กดทางลัดแล้ว `navigate()` ตรงไปแอปนั้นเลยไม่ต้องผ่าน sidebar.
- **การ์ดแจ้งเตือน** — อ่านอย่างเดียวบนหน้าแรก + ปุ่มขวาล่างพาไปแอปที่แก้ไขได้. ตัวอย่าง: `renderTodoPreview()` (`todo.js`) → `#homeContent`, คู่ `#homeTodoEditBtn` → `#app/todo`.

## File map (avoid reading whole files)
`app.js` (~340L) — APPS registry, theme picker, router, edge-swipe-back. No tool logic.
`style.css` (~500L) — tokens, theme overrides, base/Home/tool-screen shells, shared components. No tool-specific styling.
`tools/*.js`+`.css`, one pair per tool, load order matters for JS (global scope, no modules):
```
counter        บวก/ลบ — ประวัติ+รายชื่อ panels share the ปักหมุด auto-close pattern (historyPinned/namesPinned)
todo           สิ่งที่ต้องทำ — renderTodo (full APPS tool) + renderTodoPreview (read-only Home card)
quickstart     ทางลัด — Home widget, pin/unpin APPS entries for one-tap access (no sidebar)
wonglao-core   shared state, tab-bar shell/dispatcher (renderWongLaoShell), shuffleArray() — load first
wonglao-ohana / -randomcard / -wheel / -chwazi / -quiz   5 sub-games — id/label table in README
huay           หวย — full APPS tool (split out of วงเหล้า); loadHuayState() migrates old toolhub.wonglao huayDigits/huayLast once. Ball gradient uses --accent (theme-adaptive, see Theme vars rule)
fortune        ดูดวง — full APPS tool; 2 โหมด: "ประจำวัน" (deterministic pick จากวันที่ปัจจุบัน — เหมือนกันทั้งวัน, buildFortuneData() ประกอบ FORTUNE_DATA 100 ใบจาก phrase pools ขนาด 10/9/8/7/11 ใบ ที่ coprime กันพอให้ทั้ง 100 id ได้ชุดข้อความไม่ซ้ำ) และ "เฉพาะเรื่อง" (เลือกหัวข้อ การงาน/การเงิน/ความรัก/สุขภาพ จาก FORTUNE_TOPIC_DATA แล้วสุ่มคำทำนายละเอียดของหัวข้อนั้น). หลังเปิดไพ่ พื้นหลังหน้าจอ tint เป็นสีมงคลของใบล่าสุด (fortuneApplyTint). Orb gradient + mode/topic active state ใช้ --accent (theme-adaptive); lucky-color swatches/tint stay literal (fortune data, not UI flavor)
hikeprep       เตรียมเดินป่า — HIKE_DAYS schedule, hides after HIKE_WIDGET_HIDE_AFTER
changelog      CHANGELOG_DATA + renderChangelog
games-core     เกม hub shared state (GAMES_DEFAULT_STATE), tab-bar shell/dispatcher (renderGamesShell) — load after snake/jumpking/mathquiz/sudoku/2048, before app.js
snake          งู sub-game — canvas snake; body+start-btn color is theme-adaptive (see Theme vars rule)
jumpking       Jump King sub-game — canvas climbing game: hold ◀ or ▶ to charge power in that direction, release to launch that way (no separate jump button), wall hits bounce (vx reflected × WALL_BOUNCE_DAMPING). No fall-rescue/checkpoint — falling always lands wherever a platform actually catches you (ground platform spans full width so you can't fall off the bottom). Height shown in meters (JUMPKING_PX_PER_M). Past HAZARD_MIN_HEIGHT_M (250m): platforms may generate as ice (slippery, no vx-zero on landing) or lava (5s stand timer then explodes, launching the player away), and random ~15-20s wind gusts nudge the player sideways while airborne. High score persisted; player color is theme-adaptive (--accent), hazard colors are fixed.
mathquiz       คิดเลขเร็ว sub-game — 3s show / 5s answer flash quiz, typed or multiple-choice (configurable choice count), streak difficulty ramp
sudoku         ซูโดกุ sub-game — 9x9, uniqueness-preserving digger (sudokuGeneratePuzzle: fills a random full board then removes cells while a backtracking solver confirms exactly one solution remains) at 3 difficulties, real-time row/col/box conflict highlighting, 3 hints/game, notes-mode toggle (sudokuNotesMode, module-level like wlTabbarHidden — pencil-mark a cell instead of answering; setting a real value clears that cell's notes + strips the number from peer cells' notes via sudokuPeerIndices), best time per difficulty persisted
2048           2048 sub-game — slide-and-merge, board size selectable 4x4-8x8 on the start screen (g2048Move/g2048CanMove/etc. all take a size param), swipe board or dpad buttons, best score persisted per size; tile colors are the classic 2048 palette (fixed, not theme-adaptive — see Theme vars rule)
```
Home = topbar → `#quickstartContent` (pinned-apps widget) → `#homeContent` (todo preview, `#homeTodoEditBtn` in its own header row) → sidebar (all `APPS` + changelog). No icon grid anywhere.

## Token-efficiency habits
- Don't `Read` a tool file pair unless the task touches it — use the map above / `Grep`.
- Don't re-`Read` after `Edit` — it already errors on a bad match.
- Prefer `get_page_text`/`find` over screenshots unless checking visual layout.
- `browser_batch` a verification sequence instead of one call per step.
- Long pasted content → scratch file + reference, not inline twice.
- Before `python -m http.server 8080`, check the port's free (`netstat -ano | grep ':8080.*LISTENING'`) — a second server racing on it serves stale files non-deterministically and looks like a cache bug.
- Default to text/JSON assertions (`page.evaluate()` returning a small object, `console.log`) over screenshots when testing — a screenshot costs far more tokens than a values check. Take one only for a genuine visual/layout sanity check, usually right at the end.
- Batch several checks into one `page.evaluate()` call instead of one round-trip per assertion.
- For consistency audits (counting entries, checking a claim against code) reach for `grep -c`/a one-line `node -e` snippet before reading a whole file.

## Rules
- **Batch to one version bump.** Iterate/test freely without touching `CACHE_VERSION` (hard-reload bypasses the SW). Bump + ship as one multi-bullet version at a natural stopping point, not per-request. Ship immediately only if asked to see it live now, or the request is already substantial alone.
- **Bump `CACHE_VERSION`** (`sw.js`, plain `"vN"`) on any shipped change to `app.js`/`tools/*`/`style.css`/`index.html`/`manifest.json`.
- **Add a `CHANGELOG_DATA` entry** (front of array, `tools/changelog.js`) for anything the owner would notice — Thai, one bullet per change, `added`/`changed`/`removed`. `version` echoes the bumped `CACHE_VERSION`. Skip pure-internal changes.
- **New tool file** → add to `PRECACHE_URLS` (`sw.js`) + `<script>`/`<link>` in `index.html` (script before `app.js`), or it works online but not offline-first-load.
- **All UI text is Thai.**
- **No test suite** — verify manually (local server + `mcp__claude-in-chrome__*`), click through UI changes.
- **New top-level tool** → `tools/x.js`+`.css`, tags in `index.html`, `renderX(container)`, entry in `APPS`, files in `PRECACHE_URLS`.
- **New วงเหล้า sub-game** → entry in `WONGLAO_TABS` + `WONGLAO_DEFAULT_STATE`, dispatch branch in `renderWongLaoShell`, render fn + styles (inline in wonglao-core if small, own file pair if big) — all in `tools/wonglao-core.js`.
- **New เกม sub-game** → own `tools/yourgame.js`+`.css` (register both in `index.html` before `games-core.js`, and in `PRECACHE_URLS`), entry in `GAME_TABS` (`tools/games-core.js`), dispatch branch in `renderGamesShell`. Same shape as a top-level tool's `renderX(container)` — the hub just swaps which one renders into `#gameBody`. Filename may start with a digit (`2048.js`); function/const names can't, so prefix them (`render2048`, `G2048_*`).
- **Icons**: `iconImg` (SVG, `icons/emoji/`) optional alongside required `icon` (emoji fallback). New images → `PRECACHE_URLS`. Keep the Twemoji attribution comment in `index.html`'s `<body>` accurate while any such asset is in use.
- **localStorage**: new persisted field → add to that tool's default-state shape, not just the code using it. `loadWongLaoState()` spread-merges defaults; `loadCounterState()` uses per-field `typeof` checks — same principle either way.
- **Fullscreen reveal overlays**: forced-reflow trigger (`void overlay.offsetHeight; overlay.classList.add("show")`), never double-rAF (unreliable here). Copy an existing `show*Overlay`. Root class must include `reveal-overlay` if it closes on tap-anywhere, or edge-swipe-back leaves it stuck onscreen.
- **Flex chain** (`#app → .tool-screen → .tool-body → wrapper`): every link needs `min-height: 0` or content-less children collapse to zero height.
- **Width cap** (`--app-max-width: 520px`): prefer `position: absolute` inside a `position: relative`, capped ancestor (e.g. `.home-edit-fab` in `.home`) for new floating elements — no vw math. Only use `right: max(16px, calc((100vw - var(--app-max-width))/2 + 16px))` for true full-viewport elements (sidebar-level).
- **Design tokens** (`--radius-*`/`--shadow-*`/`--duration-*`/`--ease-bounce`): reuse instead of new literals. Most tool CSS files use them now; `changelog.css`/`wonglao-chwazi.css`/`wonglao-randomcard.css`/`wonglao-wheel.css` don't yet — migrate opportunistically, not as a sweep. Flavor colors/shadows stay literal (tool identity, not inconsistency).
- **Theme vars**: flavor colors fixed across themes by default; exceptions = `todo.css` (fully theme-var-built), งู's snake body/start-btn, Jump King's player color, and หวย's ball gradient (all `--accent`). 2048's tile palette and sudoku's given/entered/conflict colors are intentionally fixed literals, not exceptions. New theme → one `THEMES` entry + one `:root[data-theme]` block. Use `var(--hairline)` not hardcoded white/black for borders on themed surfaces.
- `git push` rejected non-fast-forward → another session may be editing concurrently; `fetch` + check `log HEAD..origin/main`, don't force-push.
- No Web Push (VAPID) — sandbox blocks the egress; `PushNotification` handles the hiking reminder instead. Stale references anywhere should be deleted.

## External state not in this repo
- Cloud routine (`trig_01AuHV3Bt8XtvCGfFVgbThcc`, "แจ้งเตือนเตรียมเดินป่ารายวัน") fires daily 00:00 Thai time via `PushNotification`. Has its own copy of the `HIKE_DAYS` schedule — no automated sync, update both manually if the schedule changes. Manage via `RemoteTrigger` or https://claude.ai/code/routines.
