# ToolHub

A personal PWA (Progressive Web App) that acts as a hub of small tools/utilities. No build step, no framework, no backend — plain HTML/CSS/JS, hosted as a static site.

- **Live URL:** https://eubontuu.github.io/toolhub/
- **Repo:** https://github.com/eubontuu/toolhub
- **Hosting:** GitHub Pages, deployed from the `main` branch root on every push (Settings → Pages → Deploy from a branch).

## Why this exists

The owner wanted a single app icon on their phone that bundles several small personal tools instead of separate throwaway apps. It's built incrementally — new tools get added as new entries in a registry (see below), not as separate projects.

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
tools/wonglao-wheel.{js,css}         สุ่ม (เดิมชื่อ "วงล้อ"/"สุ่มเลข") — 2 โหมด: สุ่มเลข + ลูกเต๋า
tools/wonglao-chwazi.{js,css}        Chwazi
tools/wonglao-quiz.{js,css}          Flash Quiz
tools/hikeprep.{js,css}              เตรียมเดินป่า — full-screen APPS tool, 6-week schedule + daily checklist
tools/snake.{js,css}                 งู — full-screen APPS tool, canvas classic snake, theme-adaptive color
tools/changelog.{js,css}             การอัปเดต (changelog) — data + render, opened from the sidebar
sw.js                                service worker: offline cache + update mechanism
manifest.json                        PWA metadata (name, icons, display mode)
icons/                               app icons (192, 512, apple-touch-icon)
icons/emoji/                         Twemoji SVGs used as icon images (CC-BY 4.0, see index.html body comment)
```

There is no bundler, no `node_modules`, no `package.json`, no ES modules — every JS file is a plain classic `<script>` tag and every CSS file a plain `<link rel="stylesheet">`, so **everything lives in one shared global scope/cascade and load order in `index.html` matters for JS**. `tools/wonglao-core.js` defines `shuffleArray`, `saveWongLaoState`/`loadWongLaoState`, and the tab-bar shell/dispatcher, so it must load before the other `tools/wonglao-*.js` files, which in turn must all load before `app.js` (whose `APPS` array references render functions by name at top-level). CSS order rarely matters — each tool's classes are uniquely prefixed (`.ohana-*`, `.rc-*`, `.hike-*`, ...). Edit the files directly and reload.

## Architecture

### App shell / registry pattern

`app.js` opens with an `APPS` array — each entry becomes a sidebar nav item and a `#app/<id>` route:

```js
const APPS = [
  { id: "counter",  name: "บวก/ลบ",        icon: "±",  iconImg: "icons/emoji/abacus.svg", render: renderCounter },
  { id: "wonglao",  name: "วงเหล้า",       icon: "🍻", iconImg: "icons/emoji/beers.svg",  render: renderWongLao },
  { id: "snake",    name: "งู",            icon: "🐍", render: renderSnake },
  { id: "todo",     name: "สิ่งที่ต้องทำ",  icon: "📝", render: renderTodo },
  { id: "hikeprep", name: "เตรียมเดินป่า", icon: "🥾", render: renderHikePrep },
];
```

Each entry's `icon` is a required emoji fallback/alt text; the optional `iconImg` is a path to an SVG under `icons/emoji/` (Twemoji) preferred over the emoji when present. `WONGLAO_TABS` entries follow the same shape.

Routing is a single-page hash router (`#app/<id>`, plus `#changelog`), handled by `render()`/`renderHome()`/`renderToolShell()`. `renderToolShell(title, renderFn)` draws the back-button header and calls `renderFn(container)` to fill `.tool-body` — it's not tied to an `APPS` entry, which is what lets `#changelog` reuse it too. Its back button sets a module-level `openSidebarOnHome` flag before navigating to `home`, so returning from any tool **reopens the sidebar automatically** instead of landing on a bare Home screen — lets the owner tap through several tools in a row without reopening the hamburger menu each time.

`renderHome()` itself is just the topbar (hamburger + brand + theme picker) → `#homeContent` (currently the สิ่งที่ต้องทำ read-only preview — see "Home screen patterns" below) → the `#homeTodoEditBtn` FAB → the sidebar drawer. There is no icon grid on Home anymore (removed 2026-08-29) — every แอป is reached through the sidebar.

**Theme system:** `app.js` holds a `THEMES` array (`id`/`label`/`group`/`bg`/`accent`) — two "แนะนำ" themes (dark default, light) plus a few "อื่นๆ" mood themes (grape/ivory/mint/sunset). `applyTheme(id)` sets `data-theme="<id>"` on `<html>`, which `style.css` picks up via `:root[data-theme="<id>"]` override blocks (only structural colors — `--bg`/`--card`/`--card-hi`/`--text`/`--sub`/`--hairline`, plus `--accent` for mood themes — vary; per-tool flavor colors stay fixed by default, see the theme-picker rule in `CLAUDE.md` for the current exceptions). Choice persists to `localStorage` (`toolhub.theme`, default `"dark"`) via `loadTheme()`/`saveTheme()`; `setupThemePicker()` builds the swatch popover from the "ธีม" button on Home. Adding a theme is one `THEMES` entry + one CSS override block.

**Design tokens:** `style.css`'s `:root` also defines structural tokens for radius/shadow/motion (`--radius-sm/md/lg/xl/pill/circle`, `--shadow-sm/md/lg/xl`, `--duration-tap/base/slow`, `--ease-bounce`). So far only `style.css` and `tools/counter.css` consume them; other files still use literal values, migrated opportunistically rather than in a dedicated sweep.

**Edge-swipe-back:** `app.js` attaches a global `touchstart`/`touchend` listener (bottom of the file) that treats a right-swipe starting within 24px of the left screen edge as "back." It doesn't call `navigate()` directly — it finds every `.back-btn` in the document and clicks the *last* one, so nested back buttons resolve correctly to whichever is visually "current." It checks for an open `.reveal-overlay.show` first and clicks that instead, so a swipe closes a reveal card rather than navigating underneath it. This only works because `html, body` sets `touch-action: pan-y` — without it, mobile browsers reserve horizontal edge swipes for their own back/forward gesture (desktop browser automation can't catch this class of bug — it simulates touch events directly, bypassing the OS/browser gesture recognizer).

**Responsive layout — phone-proportioned column on any screen:** `#app` is capped at `max-width: var(--app-max-width)` (520px, `style.css` `:root`) and centered with `margin: 0 auto` — a no-op on phone-width viewports, but keeps the whole app phone-sized and centered on an iPad or desktop instead of stretching every tile/font to fill a much wider canvas. **Anything `position: fixed` needs to account for this manually** since `fixed` positions relative to the viewport, not `#app`. Two patterns are in use: (1) `right: max(16px, calc((100vw - var(--app-max-width)) / 2 + 16px))` to track the column's edge — used only where an element must genuinely cover the full viewport (`.sidebar-overlay`/`.home-sidebar`); (2) simpler — `position: absolute` inside an already `position: relative`, width-capped ancestor, e.g. `.home-edit-fab` inside `.home`. Prefer (2) for anything scoped to a single screen. A full-screen "page-like" overlay (`background: var(--bg)`, not a dark backdrop) needs `max-width: var(--app-max-width); margin: 0 auto;` too; a dark-backdrop reveal-card overlay doesn't need this.

**To add a new top-level tool ("แอป"):** create `tools/yourtool.js` with a `renderYourTool(container)` function and `tools/yourtool.css`, add both `<script>`/`<link>` tags to `index.html` (script before `app.js`), push an entry onto `APPS` in `app.js`, and add both files to `PRECACHE_URLS` in `sw.js`.

### Home screen patterns ("วิดเจ็ต" / "การ์ดแจ้งเตือน")

See `CLAUDE.md`'s terminology section for the full definitions — briefly: a **วิดเจ็ต** is fully editable in place on Home, not registered in `APPS` (no current live example). A **การ์ดแจ้งเตือน** is read-only with a jump button to the real editable แอป — current example: สิ่งที่ต้องทำ, via `renderTodoPreview()` (`tools/todo.js`) rendered into `#homeContent` by `renderHome()`, paired with the `#homeTodoEditBtn` "แก้ไข" button that navigates to `#app/todo`. Both patterns are plain render functions loaded like any tool file, neither registered in `APPS`.

### การอัปเดต (changelog)

Reached from the sidebar's "การอัปเดต" nav item, which navigates to `#changelog` — `render()` special-cases this to call `renderToolShell("การอัปเดต", renderChangelog)`. `renderChangelog` and its data live in `tools/changelog.js` — `CHANGELOG_DATA` is a plain array of `{ version, date, items: [{ type: "added"|"changed"|"removed", text }] }`, newest first, hand-written in Thai (not auto-generated from git log).

**Update this on every ship the owner would care about** by pushing a new object onto the *front* of `CHANGELOG_DATA`. Skip pure-internal changes unless worth mentioning for transparency. `version` is cosmetic but by convention echoes the `CACHE_VERSION` bumped in the same change.

### The "วงเหล้า" (wonglao) sub-hub

`wonglao` is a mini hub with 5 sub-games, switched via one **persistent single-row tab bar** (`WONGLAO_TABS`) shown above the active game — not a separate menu screen. Tapping a tab switches games instantly; the bar can be hidden/shown via a small toggle button to reclaim vertical space, and if the tabs don't fit one row, side arrow buttons scroll the strip instead of wrapping to a 2nd row. See `renderWongLaoShell` in `tools/wonglao-core.js`.

| id | label | render function |
|---|---|---|
| `ohana` | ไพ่ Ohana | `renderOhanaGame` |
| `randomcard` | ไพ่สุ่ม | `renderRandomCardGame` |
| `wheel` | สุ่ม | `renderWheelGame` |
| `chwazi` | Chwazi | `renderChwaziGame` |
| `quiz` | Flash Quiz | `renderFlashQuizGame` |

All five share one state blob (see Persistence below), loaded/saved via `loadWongLaoState()`/`saveWongLaoState()`.

**To add a new wonglao sub-game:** add an entry to `WONGLAO_TABS` and its default fields to `WONGLAO_DEFAULT_STATE` (both in `tools/wonglao-core.js`), add a branch in `renderWongLaoShell`'s dispatcher, then write the render function and its styles — inline in `wonglao-core.js`/`.css` for something small, or its own `tools/wonglao-yourgame.js` + `.css` for something bigger.

### Fullscreen "reveal" overlays

Ohana, ไพ่สุ่ม, สุ่ม's spin/dice result, Flash Quiz's question, and บวก/ลบ's "เพิ่มไปยังรายชื่อ" name popup all use a fullscreen overlay pattern for the "reveal" moment: a full-viewport `position:fixed` div is appended to `document.body`, animated in via a CSS class toggle, and removed on tap. Look at `showOhanaOverlay`, `showRcOverlay`, `showWheelOverlay`, `showDiceOverlay`, `showQuizOverlay`, `showCounterNameOverlay` for the pattern. This is standing house style — every game with a card/question "open" action should use it, and its root class list must include `reveal-overlay` so the edge-swipe-back handler can find and dismiss it.

**Important gotcha:** the animation-in trigger must use the forced-reflow technique, not double-`requestAnimationFrame`:

```js
document.body.appendChild(overlay);
void overlay.offsetHeight; // force a synchronous layout flush
overlay.classList.add("show");
```

`requestAnimationFrame` nested twice is the "normal" way to do this, but it proved unreliable in at least one tested environment (rAF callbacks never fired) — the reflow trick is synchronous and always works. Don't regress to rAF here.

### Layout: the flex chain must not break

`#app → .tool-screen → .tool-body → <tool's own wrapper>` is a chain of `flex:1; display:flex; flex-direction:column`. Every link also needs `min-height: 0` — without it, a flex child with no intrinsic content collapses to zero height instead of filling the screen. If you add a new tool and its content isn't filling the screen, check this chain first.

### Persistence — everything is `localStorage`, no backend

| key | shape | used by |
|---|---|---|
| `toolhub.counter` | `{ value, step, history: [{delta, time, isReset?}], showHistory, historyPinned, names: [{name, total}], showNames, namesPinned }` | บวก/ลบ — `history` logs every +/− tap and reset; `names` is the ให้/ได้ ledger (net total owed per name); the two `*Pinned` flags gate whether that panel auto-closes on the next +/− tap |
| `toolhub.todo` | `{ items: [{id, text, done, date?, subject?}] }` | สิ่งที่ต้องทำ — both the full APPS screen and the Home preview read this key |
| `toolhub.wonglao` | one big object — see `WONGLAO_DEFAULT_STATE` in `tools/wonglao-core.js` for every field | all 5 wonglao sub-games |
| `toolhub.hikeprep.<YYYY-MM-DD>` | `"1"` / `"0"` | เตรียมเดินป่า per-day "done" checkbox |
| `toolhub.snake.highScore` | number string | งู high score |
| `toolhub.theme` | theme id string, e.g. `"dark"` | theme picker (`app.js`) — UI preference, not tool data |

`loadWongLaoState()` always merges `{...WONGLAO_DEFAULT_STATE, ...JSON.parse(saved)}` — **never read `localStorage` directly without this merge**. A saved state from before a new field existed would otherwise come back `undefined` for that field. `loadCounterState()` follows the same principle with per-field `typeof` checks instead of a spread-merge. When adding a new persisted field to any tool, add it to that tool's default-state object, not just to the code that uses it.

Nothing is synced anywhere — data lives only in the browser that created it. Reinstalling the PWA wipes it. Intentional/acceptable for this app's scope.

## PWA mechanics — how updates actually reach the phone

This app is installed via Safari "Add to Home Screen" on iOS (no App Store, no Apple Developer account). Two consequences:

### 1. Content updates: `sw.js` cache-busting

`sw.js` uses a cache-first / stale-while-revalidate strategy: on every request it serves the cached file instantly (if present) and re-fetches in the background to update the cache for *next* time. The cache is versioned:

```js
const CACHE_VERSION = "vN";   // <-- bump this (increment N) on every deploy that changes any precached file
```

**You must bump `CACHE_VERSION` every time you change `app.js`, any `tools/*.js`/`tools/*.css`, `style.css`, `index.html`, or `manifest.json`.** Without it, installed clients may keep serving old cached files indefinitely — the `install` step only re-fetches everything when `sw.js` itself is byte-different, and a version bump is what makes it different. A new `tools/*.js`/`tools/*.css` file must also be added to `PRECACHE_URLS` or it won't be available offline on first load (it still works online, fetched lazily).

Even with the bump, a real device may need the app **closed and reopened twice** to show new content — the first reopen lets the browser notice `sw.js` changed and finish installing the new cache in the background; only the second is guaranteed to render from the new cache. Normal stale-while-revalidate behavior, not a bug.

### 2. The home-screen icon image is locked at install time

iOS snapshots the icon bitmap when the user taps "Add to Home Screen" and never re-checks `manifest.json`/`icons/*.png` afterward. The only fix for a changed icon is: delete the icon from the home screen, then Add to Home Screen again.

## Local development

No build step. Serve the folder and open it:

```bash
cd ToolHub
python -m http.server 8080
# open http://localhost:8080 (or http://<your-LAN-ip>:8080 from a phone on the same WiFi)
```

**Check nothing is already listening on port 8080 before starting a new server** (e.g. `netstat -ano | grep ':8080.*LISTENING'` on Windows/git-bash, kill any stale PID first) — two servers racing on the same port serve stale files non-deterministically and looks exactly like a caching bug.

Because of the service worker, **when testing local changes in a browser that already visited this origin before**, you likely need to clear the old service worker/cache before a plain reload shows your edit:

```js
// paste in the browser devtools console for the tab under test
const regs = await navigator.serviceWorker.getRegistrations();
for (const r of regs) await r.unregister();
const keys = await caches.keys();
for (const k of keys) await caches.delete(k);
```

...then hard-reload (Ctrl+Shift+R). Only needed for local iteration; doesn't affect the deployed instance, whose users go through the normal (slower, two-reopen) update path above.

## Deployment

```bash
git add app.js tools/ style.css sw.js index.html   # (or whichever files changed)
git commit -m "..."
git push
```

GitHub Pages redeploys automatically on push to `main` (usually live within ~1 minute, occasionally slower due to Fastly edge caching, `Cache-Control: max-age=600` on assets). No CI, no build.

## The daily "เตรียมเดินป่า" push-notification routine

Outside this repo, a scheduled cloud routine (Claude Code "routine", trigger id `trig_01AuHV3Bt8XtvCGfFVgbThcc`, "แจ้งเตือนเตรียมเดินป่ารายวัน") fires once a day at 00:00 Thai time. Not part of this codebase, no file here — configured entirely server-side via the Claude routines API:

- It contains its **own copy** of the day-by-day schedule table that lives in `HIKE_DAYS` in `tools/hikeprep.js`. Editing `HIKE_DAYS` drifts the routine's copy out of sync unless someone also updates the routine's prompt. No automated sync between the two.
- It sends the reminder via Claude's own `PushNotification` tool (a notification from Claude, not the ToolHub app icon) — not email, not raw Web Push. Raw Web Push was tried first but the cloud sandbox blocks `web.push.apple.com` egress (403), so that path was fully removed — any leftover references to VAPID keys/push subscriptions are stale.
- The notification links to `https://eubontuu.github.io/toolhub/#app/hikeprep` so tapping context (manually, since `PushNotification` has no clickable action) takes the user straight into this tool.

If the trip dates or schedule change, both `HIKE_DAYS` (here) and the routine's prompt (via the Claude routines API) need updating together.

## Known quirks worth knowing before you dive in

- **No icon grid anywhere anymore.** Home and วงเหล้า both moved from icon-grid pickers to sidebar/tab-bar navigation (2026-08-29) — if you see `.grid`/`.icon-btn`/`.icon-tile`/`.icon-img`/`.icon-label` referenced anywhere, they're stale (removed from `style.css`).
- **Thai text throughout** — all user-facing strings, comments where present, and this README's terminology assume a Thai-reading maintainer. Keep new UI text in Thai unless told otherwise.
- **No test suite.** Verification has been manual: local `python -m http.server` + browser automation (screenshot-driven) for every feature added so far.
