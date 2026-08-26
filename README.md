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
app.js                               app shell only: APPS registry, router, boot
style.css                            shared/shell styles only: :root vars, base, Home, generic tool screen, small shared components
tools/counter.{js,css}               บวก/ลบ
tools/wonglao-core.{js,css}          วงเหล้า shared state, menu/router, สุ่มคน, shuffleArray util, shared wonglao styles
tools/wonglao-ohana.{js,css}         ไพ่ Ohana
tools/wonglao-randomcard.{js,css}    ไพ่สุ่ม
tools/wonglao-wheel.{js,css}         สุ่มเลข (เดิมชื่อ "วงล้อ")
tools/wonglao-chwazi.{js,css}        Chwazi
tools/wonglao-quiz.{js,css}          Flash Quiz
tools/hikeprep.{js,css}              เตรียมเดินป่า
tools/changelog.{js,css}             การอัปเดต (changelog) — data + render, shown from a 🕘 button on Home
sw.js                                service worker: offline cache + update mechanism
manifest.json                        PWA metadata (name, icons, display mode)
icons/                               app icons (192, 512, apple-touch-icon)
```

There is no bundler, no `node_modules`, no `package.json`, no ES modules — every JS file is a plain classic `<script>` tag and every CSS file a plain `<link rel="stylesheet">`, so **everything lives in one shared global scope/cascade and load order in `index.html` matters for JS**. `tools/wonglao-core.js` defines `shuffleArray`, `saveWongLaoState`/`loadWongLaoState`, and the menu/dispatcher, so it must load before the other `tools/wonglao-*.js` files, which in turn must all load before `app.js` (whose `APPS` array references `renderCounter`/`renderWongLao`/`renderHikePrep` by name at top-level). CSS order is much less strict — each tool's classes are uniquely prefixed (`.ohana-*`, `.rc-*`, `.hike-*`, ...) so files rarely compete; the one place order-independence is relied on is `.wl-menu .grid` in `wonglao-core.css` overriding the shared `.grid` from `style.css`, which works regardless of link order because the compound selector has higher specificity. Edit the files directly and reload.

## Architecture

### App shell / registry pattern

`app.js` (small — shell only, everything else lives in `tools/`) opens with an `APPS` array — this is the Home screen's icon grid:

```js
const APPS = [
  { id: "counter",  name: "บวก/ลบ",        icon: "±",  render: renderCounter },
  { id: "todo",     name: "สิ่งที่ต้องทำ",  icon: "📝", render: renderTodo },
  { id: "wonglao",  name: "วงเหล้า",        icon: "🍻", render: renderWongLao },
  { id: "hikeprep", name: "เตรียมเดินป่า",  icon: "🥾", render: renderHikePrep },
];
```

Routing is a single-page hash router (`#app/<id>`, plus the special `#changelog` route below), handled by `render()`/`renderHome()`/`renderToolShell()` near the top of `app.js`. `renderToolShell(title, renderFn)` draws the back-button header (given a title string) and calls `renderFn(container)` to fill `.tool-body` — it's not tied to an `APPS` entry, which is what lets `#changelog` reuse it too.

**To add a new top-level tool ("แอป"):** create `tools/yourtool.js` with a `renderYourTool(container)` function and `tools/yourtool.css` for its styles, add both `<script src="tools/yourtool.js"></script>` (before the `app.js` tag) and `<link rel="stylesheet" href="tools/yourtool.css">` to `index.html`, push an entry onto `APPS` in `app.js`, and add both new files to `PRECACHE_URLS` in `sw.js`.

### Home-screen notice cards ("การ์ดแจ้งเตือน")

Some tools are worth surfacing a preview of on the Home screen, even though editing them still needs the full tap-through screen. A **notice card** is a **read-only** summary embedded directly on Home (no navigation required to see it), with a jump button that sends you to the real, editable **"แอป"** (`APPS` entry, opened behind `renderToolShell`'s back-button header) — it never lets you add/edit/delete inline itself.

สิ่งที่ต้องทำ (to do list) uses this split: `renderHome()` in `app.js` renders a `<div class="todo-notice" id="todoNotice">` between the banner and the icon grid, then calls `renderTodoNotice(document.getElementById("todoNotice"))` (from `tools/todo.js`) — it lists a few pending items plus a "ไปที่รายการ ›" button that calls `navigate("app/todo")`. The actual add/check/delete UI lives in `renderTodo(container)` in the same file, registered as a normal `APPS` entry (`id: "todo"`) and reached via `renderToolShell` like any other tool. Both functions read/write the same `localStorage` key (`toolhub.todo`) independently — `renderTodoNotice` just never mutates it.

**To add a new notice card:** write a `renderYourThingNotice(container)` function in your tool's file that only reads state and renders a summary + a `navigate("app/yourtool")` jump button (no inline editing), add a container div for it in `renderHome()`, and keep the real editable UI as a normal `APPS`-registered tool.

### การอัปเดต (changelog)

A 🕘 button in the top-right of the Home screen navigates to `#changelog`, which `render()` special-cases to call `renderToolShell("การอัปเดต", renderChangelog)`. `renderChangelog` and its data both live in `tools/changelog.js` — `CHANGELOG_DATA` is a plain array of `{ version, date, items: [{ type: "added"|"changed"|"removed", text }] }`, newest entry first, hand-written in Thai (not auto-generated from git log).

**Update this on every ship the owner would care about** (new feature, visible fix, something removed) by pushing a new object onto the *front* of `CHANGELOG_DATA` in `tools/changelog.js`. Skip it for pure-internal changes (refactors with no behavior change, doc updates) unless they're worth mentioning for transparency. The `version` field is cosmetic — by convention it echoes the `CACHE_VERSION` you're bumping in the same change, but nothing enforces that link.

### The "วงเหล้า" (wonglao) sub-hub

`wonglao` is itself a mini hub: it has its own icon-grid menu (`WONGLAO_TABS`) with 6 mini-games, each with its own back button nested under wonglao's header. This pattern (menu screen + per-item detail screen, both driven by one `state.tab` field) exists because a flat tab bar with 6 items was too cramped — see `renderWongLaoMenu` / `renderWongLaoGame` in `tools/wonglao-core.js`.

Sub-games and their render functions:

| id | label | render function |
|---|---|---|
| `picker` | สุ่มคน | `renderPickerGame` |
| `ohana` | ไพ่ Ohana | `renderOhanaGame` |
| `randomcard` | ไพ่สุ่ม | `renderRandomCardGame` |
| `wheel` | สุ่มเลข | `renderWheelGame` |
| `chwazi` | Chwazi | `renderChwaziGame` |
| `quiz` | Flash Quiz | `renderFlashQuizGame` |

All six share one state blob (see Persistence below), loaded/saved via `loadWongLaoState()` / `saveWongLaoState()`.

**To add a new wonglao sub-game:** add an entry to `WONGLAO_TABS` and its default fields to `WONGLAO_DEFAULT_STATE` (both in `tools/wonglao-core.js`), add a branch in `renderWongLaoGame`'s dispatcher (also in `wonglao-core.js`), then write the render function and its styles — either inline in `wonglao-core.js`/`.css` for something small, or its own `tools/wonglao-yourgame.js` + `.css` (register both in `index.html` and `PRECACHE_URLS` like any other tool file) for something bigger.

### Fullscreen "reveal" overlays

Ohana, ไพ่สุ่ม, สุ่มเลข's spin result, and Flash Quiz's question all use a fullscreen overlay pattern for the "reveal" moment: a full-viewport `position:fixed` div is appended to `document.body` (not the tool container), animated in via a CSS class toggle, and removed on tap. Look at `showOhanaOverlay`, `showRcOverlay`, `showWheelOverlay`, `showQuizOverlay` for the pattern — copy one of these for any future "big reveal" moment. This is a standing house style: every game with a card/question "open" action should use it.

**Important gotcha:** the animation-in trigger must use the forced-reflow technique, not double-`requestAnimationFrame`:

```js
document.body.appendChild(overlay);
void overlay.offsetHeight; // force a synchronous layout flush
overlay.classList.add("show");
```

An earlier version used `requestAnimationFrame` nested twice, which is the "normal" way to do this — but it turned out unreliable in at least one tested environment (rAF callbacks never fired), while the reflow trick is synchronous and always works. Don't regress to rAF here.

### Layout: the flex chain must not break

`#app → .tool-screen → .tool-body → <tool's own wrapper>` is a chain of `flex:1; display:flex; flex-direction:column`. Every link in that chain also needs `min-height: 0` — without it, a flex child that has no intrinsic content (like Chwazi's empty touch-tracking `<div>`) collapses to zero height instead of filling the screen. This was a real bug found during development (`.tool-body` was missing from the CSS entirely for a long time and nothing broke visibly, because every other tool happened to have enough content to overflow the box anyway). If you add a new tool and its content isn't filling the screen, check this chain first.

### Persistence — everything is `localStorage`, no backend

| key | shape | used by |
|---|---|---|
| `toolhub.counter` | `{ value, step }` | บวก/ลบ |
| `toolhub.wonglao` | one big object — see `WONGLAO_DEFAULT_STATE` in `tools/wonglao-core.js` for every field | all 6 wonglao sub-games |
| `toolhub.hikeprep.<YYYY-MM-DD>` | `"1"` / `"0"` | เตรียมเดินป่า's per-day "done" checkbox |

`loadWongLaoState()` always merges `{...WONGLAO_DEFAULT_STATE, ...JSON.parse(saved)}` — **never read `localStorage` directly without this merge**. A saved state from before a new field existed would otherwise come back `undefined` for that field (this caused a real bug: วงล้อ showed "undefined" instead of "?" until the merge was added). When adding a new persisted field to any tool, add it to that tool's default-state object, not just to the code that uses it.

Nothing is synced anywhere — data lives only in the browser that created it. Reinstalling the PWA (delete + re-add to home screen) wipes it. This is intentional/acceptable for this app's scope.

## PWA mechanics — how updates actually reach the phone

This app is installed via Safari "Add to Home Screen" on iOS (no App Store, no Apple Developer account). That has two consequences to know before touching anything:

### 1. Content updates: `sw.js` cache-busting

`sw.js` uses a cache-first / stale-while-revalidate strategy: on every request it serves the cached file instantly (if present) and re-fetches in the background to update the cache for *next* time. The cache is versioned:

```js
const CACHE_VERSION = "v20";   // <-- bump this on every deploy that changes any precached file
```

**You must bump `CACHE_VERSION` every time you change `app.js`, any `tools/*.js`/`tools/*.css`, `style.css`, `index.html`, or `manifest.json`.** If you don't, installed clients may keep serving the old cached files indefinitely, because the `install` step only re-fetches everything when the service worker script itself (`sw.js`) is byte-different from what's currently registered. A version bump is what makes `sw.js` different. If you add a new `tools/*.js`/`tools/*.css` file, also add it to `PRECACHE_URLS` in `sw.js` — a file missing from that list still works (fetched on demand and cached lazily via the stale-while-revalidate handler) but won't be available offline on first load.

Even with the bump, a real device may need the app **closed and reopened twice** to show new content: the first reopen is what lets the browser notice `sw.js` changed and finish installing the new cache in the background; only the *second* reopen is guaranteed to render from the new cache. This is normal stale-while-revalidate behavior, not a bug — just something to tell the user when handing off an update.

### 2. The home-screen icon image is locked at install time

iOS snapshots the icon bitmap when the user taps "Add to Home Screen" and does **not** re-check `manifest.json`/`icons/*.png` afterward. Changing the icon files has zero visible effect on an already-installed icon. The only fix is: delete the icon from the home screen, then Add to Home Screen again. Don't spend time debugging "why doesn't my new icon show up" — this is expected.

## Local development

No build step. Serve the folder and open it:

```bash
cd ToolHub
python -m http.server 8080
# open http://localhost:8080 (or http://<your-LAN-ip>:8080 from a phone on the same WiFi)
```

**Check nothing is already listening on port 8080 before starting a new server** (e.g. `netstat -ano | grep ':8080.*LISTENING'` on Windows/git-bash, kill any stale PID first). Two servers racing on the same port serve stale files non-deterministically and looks exactly like a caching bug — this cost a real debugging detour once.

Because of the service worker caching described above, **when testing local changes in a browser that already visited this origin before**, you likely need to clear the old service worker/cache before a plain reload will show your edit:

```js
// paste in the browser devtools console for the tab under test
const regs = await navigator.serviceWorker.getRegistrations();
for (const r of regs) await r.unregister();
const keys = await caches.keys();
for (const k of keys) await caches.delete(k);
```

...then hard-reload (Ctrl+Shift+R). This is only needed for local iteration; it doesn't affect the deployed instance on GitHub Pages, whose users go through the normal (slower, two-reopen) update path described above.

## Deployment

```bash
git add app.js tools/ style.css sw.js index.html   # (or whichever files changed)
git commit -m "..."
git push
```

GitHub Pages redeploys automatically on push to `main` (usually live within ~1 minute, occasionally slower due to Fastly edge caching, `Cache-Control: max-age=600` on assets). No CI, no build — the pushed files are served as-is.

## The daily "เตรียมเดินป่า" push-notification routine

Outside this repo, there's a scheduled cloud routine (Claude Code "routine", trigger id `trig_01AuHV3Bt8XtvCGfFVgbThcc`, named "แจ้งเตือนเตรียมเดินป่ารายวัน") that fires once a day at 00:00 Thai time. It is **not part of this codebase** and has no file here — it's configured entirely server-side via the Claude routines API and only referenced here for context:

- It contains its **own copy** of the same day-by-day schedule table that lives in `HIKE_DAYS` in `tools/hikeprep.js`. If you edit `HIKE_DAYS` (e.g. rebalancing rep/set numbers), the routine's copy will drift out of sync unless someone also updates the routine's prompt to match. There is no automated sync between the two.
- It sends the reminder via Claude's own `PushNotification` tool (shows as a notification from Claude, not from the ToolHub app icon) — **not** email, and **not** raw Web Push to the PWA. Raw Web Push was implemented and tested first, but the cloud sandbox's network egress policy hard-blocks `web.push.apple.com` (403), so that path is dead and was fully removed from this codebase (there's no Web Push subscribe UI or `push`/`notificationclick` handler in `sw.js` — if you see references to VAPID keys or push subscriptions anywhere, they're stale and should be deleted).
- The notification message links back to `https://eubontuu.github.io/toolhub/#app/hikeprep` so tapping context (manually, since Claude's PushNotification has no clickable action) takes the user straight into this tool.

If the trip dates or schedule change, both `HIKE_DAYS` (here) and the routine's prompt (via the Claude routines API, not this repo) need to be updated together.

## Known quirks worth knowing before you dive in

- **Home grid is `repeat(4, 1fr)`** on the top-level Home screen but wonglao's sub-menu uses `repeat(3, 1fr)` for a tidier 2-row layout with 6 items — these are intentionally different, not inconsistent.
- **Thai text throughout** — all user-facing strings, comments where present, and this README's terminology assume a Thai-reading maintainer. Keep new UI text in Thai unless told otherwise.
- **No test suite.** Verification has been manual: local `python -m http.server` + browser automation (screenshot-driven) for every feature added so far. If you add automated tests, there's nothing here to conflict with.
