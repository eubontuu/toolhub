# ToolHub

A personal PWA (Progressive Web App) — a hub of small tools/utilities. No build step, no framework, no backend — plain HTML/CSS/JS, static site.

- **Live URL:** https://eubontuu.github.io/toolhub/
- **Repo:** https://github.com/eubontuu/toolhub
- **Hosting:** GitHub Pages, deployed from `main` root on every push.

## Why this exists

The owner wanted one app icon that bundles several small personal tools instead of separate throwaway apps. Built incrementally — new tools are new registry entries, not new projects.

## File map

```
index.html                          entry point; loads style.css + every tool's css/js in order, registers sw.js
app.js                               app shell only: APPS registry, router, theme picker, boot
style.css                            shared/shell styles only: :root vars, base, Home, generic tool screen, small shared components
tools/counter.{js,css}               บวก/ลบ (incl. ให้/ได้ ledger — see "Persistence")
tools/todo.{js,css}                  สิ่งที่ต้องทำ — full-screen APPS tool (renderTodo) + read-only Home preview (renderTodoPreview)
tools/wonglao-core.{js,css}          วงเหล้า shared state, persistent tab-bar shell/dispatcher, shuffleArray util
tools/wonglao-ohana.{js,css}         ไพ่ Ohana
tools/wonglao-randomcard.{js,css}    ไพ่สุ่ม
tools/wonglao-wheel.{js,css}         สุ่ม (เดิม "วงล้อ"/"สุ่มเลข") — 2 โหมด: สุ่มเลข + ลูกเต๋า
tools/wonglao-chwazi.{js,css}        Chwazi
tools/wonglao-quiz.{js,css}          Flash Quiz
tools/hikeprep.{js,css}              เตรียมเดินป่า — full-screen APPS tool, 6-week schedule + daily checklist
tools/games-core.{js,css}            เกม shared state, persistent tab-bar shell/dispatcher (mirrors wonglao-core's pattern)
tools/snake.{js,css}                 งู — เกม sub-game, canvas snake, theme-adaptive color
tools/jumpking.{js,css}              Jump King — เกม sub-game, canvas climbing game, charge-and-release jump, theme-adaptive color
tools/mathquiz.{js,css}              คิดเลขเร็ว — เกม sub-game, flash-shown problem then typed/multiple-choice answer, streak-based difficulty
tools/changelog.{js,css}             การอัปเดต — data + render, opened from the sidebar
sw.js                                service worker: offline cache + update mechanism
manifest.json                        PWA metadata
icons/, icons/emoji/                 app icons + Twemoji SVGs (CC-BY 4.0, see index.html body comment)
```

No bundler, no modules — every JS/CSS file is a plain `<script>`/`<link>`, so **load order in `index.html` matters for JS** (global scope). `wonglao-core.js` must load before the other `wonglao-*.js` files; `games-core.js` must load after `snake.js`/`jumpking.js`/`mathquiz.js` (it calls their render functions by name); everything must load before `app.js` (its `APPS` array references `renderWongLao`/`renderGames`/etc. by name). CSS order rarely matters — each tool's classes are uniquely prefixed.

## Architecture

### App shell / registry pattern

`app.js` opens with an `APPS` array — each entry is a sidebar nav item + a `#app/<id>` route:

```js
const APPS = [{ id, name, icon, iconImg?, render }, ...];  // 5 entries — id/name list in CLAUDE.md's glossary
```

`icon` (emoji fallback) is required; `iconImg` (SVG under `icons/emoji/`) is preferred when present. `WONGLAO_TABS` entries follow the same shape.

Hash router (`#app/<id>`, plus `#changelog`) via `render()`/`renderHome()`/`renderToolShell()`. `renderToolShell(title, renderFn)` draws the back-header and fills `.tool-body` — not tied to `APPS`, so `#changelog` reuses it too. Its back button sets an `openSidebarOnHome` flag before navigating home, so returning from any tool **reopens the sidebar automatically** — lets the owner tap through several tools without reopening the hamburger each time.

`renderHome()` = topbar → `#homeContent` (the สิ่งที่ต้องทำ read-only preview, see "Home screen patterns") → `#homeTodoEditBtn` FAB → sidebar drawer. No icon grid on Home (removed 2026-08-29) — every แอป is behind the sidebar.

**Theme system:** `THEMES` array (`id`/`label`/`group`/`bg`/`accent`) in `app.js` — dark (default)/light "แนะนำ", plus grape/ivory/mint/sunset "อื่นๆ". `applyTheme(id)` sets `data-theme` on `<html>`; `style.css`'s `:root[data-theme="..."]` blocks override structural colors only (`--bg`/`--card`/`--card-hi`/`--text`/`--sub`/`--hairline`, plus `--accent` for mood themes) — per-tool flavor colors stay fixed by default (exceptions in `CLAUDE.md`'s theme-vars rule). Persists to `toolhub.theme` via `loadTheme()`/`saveTheme()`; `setupThemePicker()` builds the popover. New theme = one `THEMES` entry + one CSS block.

**Design tokens:** `style.css`'s `:root` has radius/shadow/motion tokens (`--radius-*`, `--shadow-*`, `--duration-*`, `--ease-bounce`). Only `style.css` + `tools/counter.css` consume them so far; migrate other files opportunistically.

**Edge-swipe-back:** a global `touchstart`/`touchend` listener in `app.js` treats a right-swipe starting within 24px of the left edge as "back" — it clicks the *last* `.back-btn` in the document (so nested back buttons resolve to whichever is visually current), checking for an open `.reveal-overlay.show` first. Requires `touch-action: pan-y` on `html, body`, or mobile browsers reserve horizontal edge swipes for their own back/forward gesture (desktop automation can't catch this — it simulates touch events directly, bypassing the gesture recognizer).

**Responsive layout:** `#app` is capped at `max-width: var(--app-max-width)` (520px) and centered — a no-op on phone widths, keeps the app phone-sized on tablet/desktop instead of stretching. `position: fixed` elements need manual handling for this cap — see CLAUDE.md's "Width cap" rule for the two patterns in use.

**New top-level tool ("แอป"):** `tools/yourtool.js` (`renderYourTool(container)`) + `.css`, `<script>`/`<link>` tags in `index.html` (script before `app.js`), entry in `APPS`, both files in `PRECACHE_URLS`.

### Home screen patterns ("วิดเจ็ต" / "การ์ดแจ้งเตือน")

See `CLAUDE.md`'s glossary for the full definitions. Current live example is a **การ์ดแจ้งเตือน**: สิ่งที่ต้องทำ, via `renderTodoPreview()` (`tools/todo.js`) into `#homeContent`, paired with `#homeTodoEditBtn` → `#app/todo`. **วิดเจ็ต** (fully editable in place) has no current example. Neither pattern is registered in `APPS`.

### การอัปเดต (changelog)

Sidebar's "การอัปเดต" item → `#changelog` → `renderToolShell("การอัปเดต", renderChangelog)`. `CHANGELOG_DATA` (`tools/changelog.js`) is `{ version, date, items: [{ type, text }] }[]`, newest first, hand-written Thai. **Push a new entry onto the front on every ship the owner would notice**; `version` echoes the `CACHE_VERSION` bumped in the same change.

### The "วงเหล้า" sub-hub

5 sub-games switched via one **persistent single-row tab bar** (`WONGLAO_TABS`) above the active game — not a menu screen. Tap a tab to switch instantly; a toggle button hides/shows the bar; overflow scrolls via side arrows instead of wrapping. See `renderWongLaoShell` in `tools/wonglao-core.js`.

| id | label | render function |
|---|---|---|
| `ohana` | ไพ่ Ohana | `renderOhanaGame` |
| `randomcard` | ไพ่สุ่ม | `renderRandomCardGame` |
| `wheel` | สุ่ม | `renderWheelGame` |
| `chwazi` | Chwazi | `renderChwaziGame` |
| `quiz` | Flash Quiz | `renderFlashQuizGame` |

All five share one state blob via `loadWongLaoState()`/`saveWongLaoState()` (see Persistence).

**New sub-game:** entry in `WONGLAO_TABS` + `WONGLAO_DEFAULT_STATE`, dispatch branch in `renderWongLaoShell`, render fn + styles — inline in `wonglao-core.js`/`.css` if small, own `tools/wonglao-yourgame.{js,css}` if bigger.

### The "เกม" hub

Same tab-bar shell pattern as วงเหล้า above (own file, own state — not shared with wonglao), for mini-games rather than drinking-game rounds. See `renderGamesShell` in `tools/games-core.js`.

| id | label | render function |
|---|---|---|
| `snake` | งู | `renderSnake` |
| `jumpking` | Jump King | `renderJumpKing` |
| `mathquiz` | คิดเลขเร็ว | `renderMathQuiz` |

State (just the active `tab`) persists via `loadGamesState()`/`saveGamesState()` under `toolhub.games` — each sub-game then owns its own score/best/settings keys (see Persistence).

- **งู** (`tools/snake.js`): classic canvas snake, D-pad + swipe controls.
- **Jump King** (`tools/jumpking.js`): canvas climbing game. Hold ◀/▶ to aim, hold the jump button to charge power (bar fill shows charge), release to launch — direction+power set the jump vector. Camera eases to follow the player upward; falling more than a threshold below the highest platform reached resets the player back to that checkpoint instead of losing all progress. Height climbed is the score, best is persisted.
- **คิดเลขเร็ว** (`tools/mathquiz.js`): shows a problem for 3s, hides it, then gives 5s to answer — typed (number input) or multiple-choice (2/4/6/etc. configurable choices, wrong options generated near the right answer). Correct answers chain into a streak and problems get harder (wider number ranges, then multiplication) as it grows; wrong/timeout/give-up ends the run and offers to restart immediately.

**New sub-game:** own `tools/yourgame.{js,css}` (register in `index.html` before `games-core.js`, and in `PRECACHE_URLS`), entry in `GAME_TABS`, dispatch branch in `renderGamesShell`.

### Fullscreen "reveal" overlays

Ohana/ไพ่สุ่ม/สุ่ม/Flash Quiz/บวก-ลบ's name popup all use the same pattern: a full-viewport `position:fixed` div appended to `document.body`, animated in via a class toggle, removed on tap (`showOhanaOverlay`, `showRcOverlay`, `showWheelOverlay`, `showDiceOverlay`, `showQuizOverlay`, `showCounterNameOverlay`). House style for every card/question "open" action — exact trigger code + the `reveal-overlay` class requirement are in CLAUDE.md's overlay rule; copy an existing `show*Overlay` rather than reimplementing.

### Layout: the flex chain must not break

`#app → .tool-screen → .tool-body → <tool wrapper>` is `flex:1; display:flex; flex-direction:column` at every link — each one also needs `min-height: 0`, or a content-less child collapses to zero height. Check this first if new content isn't filling the screen.

### Persistence — everything is `localStorage`, no backend

| key | shape | used by |
|---|---|---|
| `toolhub.counter` | `{ value, step, history: [{delta, time, isReset?}], showHistory, historyPinned, names: [{name, total}], showNames, namesPinned }` | บวก/ลบ — `history` logs +/− taps and resets; `names` is the ให้/ได้ ledger; `*Pinned` gates auto-close on the next +/− |
| `toolhub.todo` | `{ items: [{id, text, done, date?, subject?}] }` | สิ่งที่ต้องทำ — both the full screen and the Home preview |
| `toolhub.wonglao` | one object — see `WONGLAO_DEFAULT_STATE` | all 5 wonglao sub-games |
| `toolhub.hikeprep.<YYYY-MM-DD>` | `"1"`/`"0"` | เตรียมเดินป่า per-day checkbox |
| `toolhub.games` | `{ tab }` | เกม hub — which sub-game tab is active |
| `toolhub.snake.highScore` | number string | งู high score |
| `toolhub.jumpking.highScore` | number string | Jump King best height score |
| `toolhub.mathquiz.bestStreak` | number string | คิดเลขเร็ว best streak |
| `toolhub.mathquiz.settings` | `{ mode: "type"\|"choice", choiceCount }` | คิดเลขเร็ว answer-mode preference |
| `toolhub.theme` | theme id string | theme picker — UI preference |

Merge-with-defaults rule is in CLAUDE.md's localStorage rule. Nothing syncs anywhere — data lives only in the browser that created it; reinstalling wipes it. Intentional for this app's scope.

## PWA mechanics

**Content updates (`sw.js` cache-busting):** cache-first / stale-while-revalidate, versioned by `const CACHE_VERSION = "vN"`. **Bump it on every change to `app.js`/`tools/*`/`style.css`/`index.html`/`manifest.json`** — otherwise installed clients keep serving old files, since `install` only re-fetches everything when `sw.js` itself is byte-different. New tool files also need `PRECACHE_URLS`, or they work online (fetched lazily) but aren't offline on first load. Even bumped, a real device may need **closed + reopened twice** to show new content (normal SW behavior).

**Home-screen icon:** iOS snapshots the icon bitmap at "Add to Home Screen" and never re-checks `manifest.json` afterward. Only fix for a changed icon: delete + re-add.

## Local development

```bash
python -m http.server 8080
# http://localhost:8080 (or http://<LAN-ip>:8080 from a phone on the same WiFi)
```

Check the port's free first (`netstat -ano | grep ':8080.*LISTENING'`, kill stale PIDs) — two servers racing on one port serves stale files non-deterministically. Because of the service worker, a browser that already visited this origin needs its SW/cache cleared before a plain reload shows local edits:

```js
// devtools console, tab under test
const regs = await navigator.serviceWorker.getRegistrations();
for (const r of regs) await r.unregister();
const keys = await caches.keys();
for (const k of keys) await caches.delete(k);
```

...then hard-reload (Ctrl+Shift+R). Only needed locally — deployed users go through the normal (slower) update path above.

## Deployment

```bash
git add app.js tools/ style.css sw.js index.html   # or whichever files changed
git commit -m "..."
git push
```

GitHub Pages redeploys on push to `main` automatically (~1 min, occasionally slower — Fastly edge caching). No CI, no build.

## The daily "เตรียมเดินป่า" push-notification routine

A cloud routine (trigger `trig_01AuHV3Bt8XtvCGfFVgbThcc`, "แจ้งเตือนเตรียมเดินป่ารายวัน") fires daily at 00:00 Thai time — not part of this repo, configured server-side via the Claude routines API. It carries its **own copy** of the `HIKE_DAYS` schedule (no automated sync — update both if the schedule changes) and sends via `PushNotification` (a Claude notification, not the app icon — raw Web Push was tried first but the cloud sandbox blocks `web.push.apple.com`, so it was fully removed; any leftover VAPID/subscription references are stale). Links to `#app/hikeprep`.

## Known quirks

- **No icon grid anywhere anymore** — Home and วงเหล้า both moved to sidebar/tab-bar nav (2026-08-29); `.grid`/`.icon-btn`/`.icon-tile`/`.icon-img`/`.icon-label` are gone from `style.css` if you see them referenced.
- **Thai text throughout** — keep new UI text Thai unless told otherwise.
- **No test suite** — verification is manual (local server + browser automation).
