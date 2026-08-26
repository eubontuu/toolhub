# CLAUDE.md — ToolHub project instructions

This file is auto-loaded by Claude Code at the start of every session in this repo. Read `README.md` first for full architecture/mechanics — this file only holds operational context and behavior rules that aren't in the README.

**Keep this file curated, not a running log.** It's read in full every session regardless of what the task touches, so its length is a cost paid every time, not just when written. When a rule stops applying (a one-time incident that's now structurally prevented, a workaround for something since fixed) or gets superseded by a better rule, remove or rewrite it — don't just append. Prefer editing an existing bullet over adding a near-duplicate one.

## What this is
- Personal PWA hub of mini-tools for the owner (Thai-speaking). No framework, no build step, no backend.
- Live: https://eubontuu.github.io/toolhub/ — Repo: https://github.com/eubontuu/toolhub (GitHub user `eubontuu`) — deploys from `main` on push.
- Files: `index.html`, `app.js` (shell/router only), `tools/*.js` + `tools/*.css` (one JS + one CSS file per tool), `style.css` (shell/shared styles only), `sw.js` (service worker), `manifest.json`, `icons/`.

## คำศัพท์ที่ใช้เรียก UI แต่ละแบบ (ใช้คำเหล่านี้คุยกับ owner ให้ตรงกัน)
- **แอป** — เครื่องมือเต็มจอที่กดเข้าไปจากไอคอนในหน้าแรก มี `renderToolShell` (หัวข้อ + ปุ่มย้อนกลับ) ครอบ, ลงทะเบียนใน `APPS` ใน `app.js`. เช่น บวก/ลบ, วงเหล้า, เตรียมเดินป่า.
- **แถบ** — แท็บ/เกมย่อยภายในแอป วงเหล้า (เช่น ไพ่ Ohana, ไพ่สุ่ม, สุ่มเลข, Chwazi, Flash Quiz) เลือกจากเมนูกริดของ `renderWongLaoMenu` ใน `tools/wonglao-core.js`.
- **วิดเจ็ต** — ส่วนที่ฝังอยู่บนหน้าแรกเลย แก้ไข/ใช้งานได้ทันทีไม่ต้องกดเข้าไปที่ไหน ไม่ได้ลงทะเบียนใน `APPS`. เช่น สิ่งที่ต้องทำ (`renderTodo(#todoWidget)` เรียกจาก `renderHome()` ใน `app.js`) — เพิ่ม/ติ๊ก/ลบได้ตรงนั้นเลย, ไม่มีปุ่มย้อนกลับเพราะไม่ได้กดเข้าไปไหน.
- **การ์ดแจ้งเตือน** — กล่องสรุปที่ฝังบนหน้าแรก **อ่านอย่างเดียว แก้ไขไม่ได้**, มีปุ่มมุมขวาล่างกระโดดไปหน้า "แอป" ที่แก้ไขได้จริง. (ยังไม่มีตัวอย่างที่ใช้งานจริงตอนนี้ — สิ่งที่ต้องทำเคยเป็นแบบนี้ช่วงสั้นๆ ก่อนย้ายกลับมาเป็นวิดเจ็ตที่แก้ไขได้ในตัวแทน เพราะ owner อยากให้ใช้งานตรงหน้าแรกได้เลยโดยไม่ต้องกดเข้าไปหน้าแยก)

## File section map (avoid reading the whole file)
Both `app.js` and `style.css` were split (2026-08) into a small shell file plus one file per tool under `tools/` — every file is small enough to `Read` whole when you touch it, so you should almost never need to read more than the one JS + one CSS file the task touches.

`app.js` (~100 lines): APPS registry, router (`render`/`renderHome`/`renderToolShell`), boot. No tool logic lives here.

`style.css` (~230 lines): `:root` vars, base `html/body/#app`, Home screen, generic Tool screen (`.tool-screen`/`.tool-header`/`.back-btn`/`.tool-body`), and small components shared by 2+ tools (`.step-row`/`.step-chip`, `.reset-btn`). No tool-specific styling lives here.

`tools/*.js` + matching `tools/*.css` — one JS+CSS pair per tool/sub-game, both loaded in this order in `index.html` (order matters for JS: no bundler, no modules, everything is global scope; CSS order mostly doesn't matter since each tool's classes are uniquely prefixed):
```
tools/counter.js + .css              บวก/ลบ — standalone
tools/todo.js + .css                 สิ่งที่ต้องทำ — Home-screen widget (renderTodo(#todoWidget) called from renderHome in app.js), fully editable in place, not a routed APPS tool
tools/wonglao-core.js + .css         วงเหล้า shared state (WONGLAO_DEFAULT_STATE), menu/dispatcher, สุ่มคน, shuffleArray() util, .wl-action-btn + .picker-*/.name-chip shared styles — load first, other wonglao-*.js depend on it
tools/wonglao-ohana.js + .css        ไพ่ Ohana
tools/wonglao-randomcard.js + .css   ไพ่สุ่ม (biggest sub-game file; its custom-input UI reuses wonglao-core.css's .picker-*/.name-chip)
tools/wonglao-wheel.js + .css        สุ่มเลข (เดิมชื่อ "วงล้อ")
tools/wonglao-chwazi.js + .css       Chwazi
tools/wonglao-quiz.js + .css         Flash Quiz — uses shuffleArray from wonglao-core.js
tools/hikeprep.js + .css             เตรียมเดินป่า (incl. HIKE_DAYS schedule array) — standalone
tools/changelog.js + .css            การอัปเดต (changelog) — CHANGELOG_DATA + renderChangelog — standalone
```

## Token-efficiency habits for sessions in this repo
- Don't `Read` a whole `tools/*.js`/`tools/*.css` pair unless the task touches that tool — everything is small now, one `Read` per file is enough. Use the map above (or `Grep`) to find the right file instead of opening several to look around.
- After an `Edit`, don't re-`Read` the file to confirm — the tool already errors if the match failed.
- When testing in the browser, prefer `get_page_text`/targeted `find` over full-page screenshots when text content (not visual layout) is what's being checked; use screenshots only for actual visual/layout verification.
- **Use `browser_batch` for browser verification sequences** (navigate → click → screenshot, or click → click → screenshot) instead of one tool call per step — it's one round trip instead of several. Only break out of a batch when a later step's coordinates depend on seeing an earlier screenshot's result first.
- Keep long pasted content (routine prompts, schedule tables, JSON bodies) in a scratch file and reference it, rather than pasting it inline in chat more than once.
- Prefer one `Grep`/`Read` with a tight scope over multiple exploratory reads — if unsure where something lives, one `Grep` across the file usually finds it faster than reading sections speculatively.
- **Before starting `python -m http.server 8080` for local testing, check nothing is already listening on that port** (`netstat -ano | grep ':8080.*LISTENING'` on Windows/git-bash) and kill any stale process first. A second server silently competing for the same port serves stale files non-deterministically and looks exactly like a CSS/cache bug — this cost a full debugging detour once (see git log around CACHE_VERSION v20).

## Rules for working in this repo
- **Always bump `CACHE_VERSION` in `sw.js`** when shipping any change to `app.js`/`tools/*.js`/`tools/*.css`/`style.css`/`index.html`/`manifest.json`. Without it, installed PWA clients won't see the update. Format: plain `"vN"`, increment N.
- **Add a `CHANGELOG_DATA` entry in `tools/changelog.js`** (push a new object onto the *front* of the array) for any change the owner would notice or care about — new feature, visible fix, something removed. Write it in Thai, keep it to 1-2 short bullets, categorize each as `added`/`changed`/`removed`. By convention `version` echoes the `CACHE_VERSION` you're bumping in the same change. Skip purely internal refactors/doc updates unless worth mentioning for transparency (see README's "การอัปเดต" section).
- **New `tools/*.js` and/or `tools/*.css` file → also add it to `PRECACHE_URLS` in `sw.js`, and add its `<script>`/`<link rel="stylesheet">` tag to `index.html`** (script before the `app.js` tag; stylesheet order mostly doesn't matter, see the specificity note in README). Forgetting either means the file loads fine online (fetched lazily) but isn't available offline on first load / isn't in the dependency chain `APPS` expects.
- **All user-facing text is Thai.** Keep new UI strings in Thai unless told otherwise.
- **No test suite.** Verify changes manually via local server (`python -m http.server 8080` — check port 8080 is free first, see below) + browser automation (`mcp__claude-in-chrome__*`) before calling something done. For UI changes, actually click through the feature.
- **New top-level tool** → create `tools/yourtool.js` + `tools/yourtool.css`, register both tags in `index.html` (script before `app.js`), write `renderYourTool(container)`, add an entry to the `APPS` array in `app.js`, add both files to `PRECACHE_URLS`. See README's "Architecture" section for the full contract.
- **New วงเหล้า sub-game** → add to `WONGLAO_TABS` and `WONGLAO_DEFAULT_STATE` (both in `tools/wonglao-core.js`), add a dispatch branch in `renderWongLaoGame` (also `wonglao-core.js`), write the render function and its styles (inline in `wonglao-core.js`/`.css` if small, else its own `tools/wonglao-yourgame.js` + `.css` registered like any tool file).
- **localStorage state**: any new persisted field must be added to that tool's default-state object. `loadWongLaoState()` (in `tools/wonglao-core.js`) merges `{...WONGLAO_DEFAULT_STATE, ...saved}` — never bypass this merge or old installs get `undefined` fields (this caused a real bug once, see README).
- **Fullscreen reveal overlays** (Ohana/ไพ่สุ่ม/สุ่มเลข/Flash Quiz style): use the forced-reflow trigger (`void overlay.offsetHeight; overlay.classList.add("show")`), not double-`requestAnimationFrame` — rAF proved unreliable in this environment. Copy an existing `show*Overlay` function. **Every game with a card/question "open" action must use this pattern** — standing house style, not optional per-game. If the overlay closes on tap-anywhere (not an explicit close button), its root element's `className` **must also include `reveal-overlay`** (alongside its own specific class, e.g. `"ohana-overlay reveal-overlay"`) — the global edge-swipe-back handler in `app.js` looks for `.reveal-overlay.show` first and clicks it to dismiss, before falling through to `.back-btn` navigation. Skipping this leaves the overlay stuck on screen (orphaned outside `#app`) if the owner swipes back while it's open.
- **Flex layout chain** (`#app → .tool-screen → .tool-body → tool wrapper`): every link needs `min-height: 0` alongside `flex:1; display:flex; flex-direction:column`, or content-less children collapse to zero height.
- **Design tokens** (`--radius-*`/`--shadow-*`/`--duration-*`/`--ease-bounce` in `style.css`'s `:root`, added 2026-08): reuse these for neutral, structural values instead of new one-off literals. Only `style.css` and `tools/counter.css` consume them so far — other `tools/*.css` files still have their own literal radius/shadow/transition values; migrate a file to the tokens opportunistically when you're already touching it, don't do a dedicated sweep. Per-tool "flavor" colors/shadows (card suits, wheel rainbow, colored button glows, etc.) are intentionally left as literals — those are tool identity, not inconsistency.
- **Theme picker**: `:root` in `style.css` holds the dark palette (`--bg`/`--card`/`--card-hi`/`--text`/`--sub`/`--accent`/`--hairline`); each theme in the `THEMES` array in `app.js` gets a matching `:root[data-theme="<id>"]` override block. Two are grouped "แนะนำ" (dark/light, `--accent` unchanged) and the rest "อื่นๆ" (grape/ivory/mint/sunset — each also overrides `--accent` for a distinct mood). `app.js` manages state (`applyTheme()`/`loadTheme()`/`saveTheme()`, `localStorage` key `toolhub.theme`, default `"dark"`) and `setupThemePicker()` builds the popover opened from the "ธีม" button in `renderHome()`. **`--green`/`--red` and every per-tool flavor color stay fixed across every theme** (same rule as design tokens above) — only `THEMES`-listed variables are meant to vary. **New theme → add one entry to `THEMES` (id/label/group/bg/accent for the swatch preview) + one `:root[data-theme="id"]` CSS block** — nothing else needs touching, the picker UI is fully data-driven. If you hardcode `rgba(255,255,255,…)` or `#fff` for a separator/border on a `var(--card)`/`var(--bg)` surface, use `var(--hairline)` instead or it'll vanish on light-background themes — this already bit two spots (`counter.css`, `wonglao-randomcard.css`) before `--hairline` existed.
- Before `git push`, if rejected as non-fast-forward, another concurrent session may be editing this same repo on the same GitHub account — `git fetch` + inspect `git log HEAD..origin/main` before merging, don't just force-push.
- Don't reintroduce Web Push (VAPID/push subscriptions) — it was tried and abandoned because the cloud routine sandbox blocks `web.push.apple.com` egress. The daily hiking-prep reminder now goes through Claude's own `PushNotification` tool instead. If you see leftover references to it anywhere, they're stale.

## External state not in this repo
- A scheduled Claude Code routine (trigger id `trig_01AuHV3Bt8XtvCGfFVgbThcc`, "แจ้งเตือนเตรียมเดินป่ารายวัน") fires daily at 00:00 Thai time and sends a `PushNotification` reminder for the hiking-prep schedule. It has its **own copy** of the day-by-day table that must be manually kept in sync with `HIKE_DAYS` in `tools/hikeprep.js` if the schedule changes — there's no automated link. Manage it via the Claude routines API (`RemoteTrigger` tool) or https://claude.ai/code/routines (routines can't be deleted via API).
