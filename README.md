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
tools/quickstart.{js,css}            ทางลัด — Home widget, pin/unpin APPS entries for one-tap access
tools/wonglao-core.{js,css}          วงเหล้า shared state, persistent tab-bar shell/dispatcher, shuffleArray util
tools/wonglao-ohana.{js,css}         ไพ่ Ohana
tools/wonglao-randomcard.{js,css}    ไพ่สุ่ม
tools/wonglao-wheel.{js,css}         สุ่ม (เดิม "วงล้อ"/"สุ่มเลข") — 2 โหมด: สุ่มเลข + ลูกเต๋า
tools/wonglao-chwazi.{js,css}        Chwazi
tools/wonglao-quiz.{js,css}          Flash Quiz
tools/huay.{js,css}                  หวย — full-screen APPS tool (split out from วงเหล้า; see Persistence for the one-time migration); roll history view via showHuayHistoryOverlay
tools/fortune.{js,css}               ดูดวง — full-screen APPS tool, daily + per-topic fortune modes (see "The ดูดวง app" below)
tools/hikeprep.{js,css}              เตรียมเดินป่า — full-screen APPS tool, 6-week schedule + daily checklist
tools/memories.{js,css}              ความทรงจำ — full-screen APPS tool, books of diary-style pages (photo/text/impression/date/time/location), custom cover per book, two-page open-book spread with tap-to-edit (toggleable "ดูอย่างเดียว" view-only mode)
tools/games-core.{js,css}            เกม shared state, persistent tab-bar shell/dispatcher (mirrors wonglao-core's pattern)
tools/snake.{js,css}                 งู — เกม sub-game, canvas snake, theme-adaptive color
tools/jumpking.{js,css}              Jump King — เกม sub-game, canvas climbing game, charge-and-release jump, wall bounce, ice/lava platforms + wind past 250m, theme-adaptive player color
tools/mathquiz.{js,css}              คิดเลขเร็ว — เกม sub-game, flash-shown problem then typed/multiple-choice answer, streak-based difficulty
tools/sudoku.{js,css}                ซูโดกุ — เกม sub-game, 9x9, uniqueness-preserving puzzle generator, 3 difficulties
tools/2048.{js,css}                  2048 — เกม sub-game, 4x4 slide-and-merge, swipe/D-pad
tools/game24.{js,css}                เกม 24 — เกม sub-game, merge number chips to hit a target, ธรรมดา (classic, solvability-guaranteed) or แอดวานซ์ (configurable count/digits, ±5 tolerance)
tools/changelog.{js,css}             การอัปเดต — data + render, opened from the sidebar
sw.js                                service worker: offline cache + update mechanism
manifest.json                        PWA metadata
icons/, icons/emoji/                 app icons + Twemoji SVGs (CC-BY 4.0, see index.html body comment)
```

No bundler, no modules — every JS/CSS file is a plain `<script>`/`<link>`, so **load order in `index.html` matters for JS** (global scope). `wonglao-core.js` must load before the other `wonglao-*.js` files; `games-core.js` must load after `snake.js`/`jumpking.js`/`mathquiz.js`/`sudoku.js`/`2048.js`/`game24.js` (it calls their render functions by name); everything must load before `app.js` (its `APPS` array references `renderWongLao`/`renderGames`/etc. by name). CSS order rarely matters — each tool's classes are uniquely prefixed.

## Architecture

### App shell / registry pattern

`app.js` opens with an `APPS` array — each entry is a sidebar nav item + a `#app/<id>` route:

```js
const APPS = [{ id, name, icon, iconImg?, render }, ...];  // 8 entries — id/name list in CLAUDE.md's glossary
```

`icon` (emoji fallback) is required; `iconImg` (SVG under `icons/emoji/`) is preferred when present. `WONGLAO_TABS` entries follow the same shape.

Hash router (`#app/<id>`, plus `#changelog`) via `render()`/`renderHome()`/`renderToolShell()`. `renderToolShell(title, renderFn)` draws the back-header and fills `.tool-body` — not tied to `APPS`, so `#changelog` reuses it too. Its back button calls `openSidebarOverlay()` directly (instead of navigating home first) — the sidebar is a `position:fixed` overlay appended straight to `document.body`, independent of whatever route is currently rendered underneath, so the dimmed background behind it is always the actual current page (tool or Home), never forced back to Home. `sidebarActiveRoute` is set right before opening so the drawer highlights whichever app the owner is currently on.

`renderHome()` = topbar (☰ menu button calls `openSidebarOverlay()`) → quick-start widget → `#homeContent` (the สิ่งที่ต้องทำ read-only preview, see "Home screen patterns"). No icon grid on Home (removed 2026-08-29) — every แอป is behind the sidebar.

**Theme system:** `THEMES` array (`id`/`label`/`group`/`bg`/`accent`) in `app.js` — dark (default)/light "แนะนำ", plus grape/ivory/mint/sunset "อื่นๆ". `applyTheme(id)` sets `data-theme` on `<html>`; `style.css`'s `:root[data-theme="..."]` blocks override structural colors only (`--bg`/`--card`/`--card-hi`/`--text`/`--sub`/`--hairline`, plus `--accent` for mood themes) — per-tool flavor colors stay fixed by default (exceptions in `CLAUDE.md`'s theme-vars rule). Persists to `toolhub.theme` via `loadTheme()`/`saveTheme()`; `setupThemePicker()` builds the popover. New theme = one `THEMES` entry + one CSS block.

**Design tokens:** `style.css`'s `:root` has radius/shadow/motion tokens (`--radius-*`, `--shadow-*`, `--duration-*`, `--ease-bounce`). Most `tools/*.css` files consume them now; `changelog.css`/`wonglao-chwazi.css`/`wonglao-randomcard.css`/`wonglao-wheel.css` are the remaining holdouts — migrate opportunistically.

**Edge-swipe-back:** a global `touchstart`/`touchend` listener in `app.js` treats a right-swipe starting within 24px of the left edge as "back" — it clicks the *last* `.back-btn` in the document (so nested back buttons resolve to whichever is visually current), checking for an open `.reveal-overlay.show` first. Requires `touch-action: pan-y` on `html, body`, or mobile browsers reserve horizontal edge swipes for their own back/forward gesture (desktop automation can't catch this — it simulates touch events directly, bypassing the gesture recognizer).

**Responsive layout:** `#app` is capped at `max-width: var(--app-max-width)` (520px) and centered — a no-op on phone widths, keeps the app phone-sized on tablet/desktop instead of stretching. `position: fixed` elements need manual handling for this cap — see CLAUDE.md's "Width cap" rule for the two patterns in use.

**New top-level tool ("แอป"):** `tools/yourtool.js` (`renderYourTool(container)`) + `.css`, `<script>`/`<link>` tags in `index.html` (script before `app.js`), entry in `APPS`, both files in `PRECACHE_URLS`.

### Home screen patterns ("วิดเจ็ต" / "การ์ดแจ้งเตือน")

See `CLAUDE.md`'s glossary for the full definitions. Current live example is a **การ์ดแจ้งเตือน**: สิ่งที่ต้องทำ, via `renderTodoPreview()` (`tools/todo.js`) into `#homeContent`, paired with `#homeTodoEditBtn` → `#app/todo`. **วิดเจ็ต** (fully editable in place) has no current example. Neither pattern is registered in `APPS`.

### การอัปเดต (changelog)

Sidebar's "การอัปเดต" item → `#changelog` → `renderToolShell("การอัปเดต", renderChangelog)`. `CHANGELOG_DATA` (`tools/changelog.js`) is `{ version, date, items: [{ type, text }] }[]`, newest first, hand-written Thai. **Push a new entry onto the front on every ship the owner would notice**; `version` echoes the `CACHE_VERSION` bumped in the same change.

### The "วงเหล้า" sub-hub

5 sub-games switched via one **persistent single-row tab bar** (`WONGLAO_TABS`) above the active game — not a menu screen. Tap a tab to switch instantly; a toggle button hides/shows the bar; overflow scrolls via side arrows instead of wrapping; a "วงเหล้าทั้งหมด" button next to the toggle opens a full-screen grid of all 5 (`showWongLaoAllOverlay`) — tap a tile to jump straight to it, tap empty space to close. See `renderWongLaoShell` in `tools/wonglao-core.js`.

| id | label | render function |
|---|---|---|
| `ohana` | ไพ่ Ohana | `renderOhanaGame` |
| `randomcard` | ไพ่สุ่ม | `renderRandomCardGame` |
| `wheel` | สุ่ม | `renderWheelGame` |
| `chwazi` | Chwazi | `renderChwaziGame` |
| `quiz` | Flash Quiz | `renderFlashQuizGame` |

All five share one state blob via `loadWongLaoState()`/`saveWongLaoState()` (see Persistence). (หวย — สุ่มเลขหวย, digit count 2/3/6 — used to be a sixth sub-game here; it's now its own top-level `APPS` tool, `tools/huay.{js,css}`, since the owner wanted one-tap access to it without going through วงเหล้า first.)

**New sub-game:** entry in `WONGLAO_TABS` + `WONGLAO_DEFAULT_STATE`, dispatch branch in `renderWongLaoShell`, render fn + styles — inline in `wonglao-core.js`/`.css` if small, own `tools/wonglao-yourgame.{js,css}` if bigger.

### The "เกม" hub

Same tab-bar shell pattern as วงเหล้า above (own file, own state — not shared with wonglao), for mini-games rather than drinking-game rounds, including its own "เกมทั้งหมด" show-all overlay (`showGameAllOverlay`). See `renderGamesShell` in `tools/games-core.js`.

| id | label | render function |
|---|---|---|
| `snake` | งู | `renderSnake` |
| `jumpking` | Jump King | `renderJumpKing` |
| `mathquiz` | คิดเลขเร็ว | `renderMathQuiz` |
| `sudoku` | ซูโดกุ | `renderSudoku` |
| `2048` | 2048 | `render2048` |
| `game24` | เกม 24 | `renderGame24` |

State (just the active `tab`) persists via `loadGamesState()`/`saveGamesState()` under `toolhub.games` — each sub-game then owns its own score/best/settings keys (see Persistence).

- **งู** (`tools/snake.js`): classic canvas snake, D-pad + swipe controls. D-pad buttons bind `pointerdown` (not `click`) for a snappier response and use a 72px touch target (`.snake-dpad-btn`).
- **Jump King** (`tools/jumpking.js`): canvas climbing game, two buttons only — hold ◀ or ▶ to charge power (bar fill shows charge) in that direction, release to launch that way (no separate jump button). Hitting a canvas wall mid-air bounces the player back (`vx` reflected and scaled by `WALL_BOUNCE_DAMPING`, so a harder hit bounces harder). No fall-rescue: there's no checkpoint that teleports you back after falling too far — you always land wherever a platform actually catches you (the ground platform spans the full canvas width, so you never fall off the bottom, just back down to whatever you missed). Camera eases to follow the player upward. Height is shown in meters (`JUMPKING_PX_PER_M` px-per-meter) and the "ความสูง" display tracks the player's live position every frame — it drops back down when they fall, unlike "สูงสุด" which is the separate all-time ratcheted high score (`bestWorldY`/`highScore`, only ever increases). Once a platform's height passes `HAZARD_MIN_HEIGHT_M` (250m), newly generated platforms may randomly come out as **ice** (slippery — landing doesn't zero `vx`; it decays via friction while the player slides, and they can slide off the edge) or **lava** (a red countdown 5→0 shows while stood on; hitting 0 launches the player away with a strong knockback). Past that same 250m mark, a random **wind** gust (`updateWind`) may start every ~8-15s of calm, lasting 15-20s, gently pushing the player sideways (`WIND_FORCE`) while airborne only — a badge shows the direction while active.
- **คิดเลขเร็ว** (`tools/mathquiz.js`): shows a problem for 3s, hides it, then gives 5s to answer — typed (number input) or multiple-choice (2/4/6/etc. configurable choices, wrong options generated near the right answer). A "ระดับเริ่มต้น" picker on the start screen (`settings.startLevel`, 0-6) sets the difficulty of the very first problem, labeled by name rather than number — `MATH_LEVEL_LABELS = ["ง่ายมาก", "ง่าย", "ปานกลาง", "ยาก", "ยากมาก", "โหด", "นรก"]`. `mathGenerateProblem(level, opsFlags, maxTerms)` looks up that level's number range (`MATH_LEVEL_RANGES`) and, once multiplication unlocks (level ≥ 2), its max factor (`MATH_LEVEL_FACTOR_MAX`, `null` below that) — both tables step up non-linearly (widening gaps) so higher levels feel meaningfully harder rather than a little harder each time. `nextProblem()` computes the live level each time as `min(startLevel + floor(streak/3), MATH_MAX_LEVEL)` — so a run started at a high level stays hard immediately instead of ramping up from scratch, while streak still always displays as a plain 0-based correct-answer count. The game-over overlay offers both "เล่นใหม่" (retry, same settings) and "ตั้งค่า" (back to the start/settings screen) rather than only a restart.
  - **Special operand types** (`settings.ops.{pow,sqrt,frac}`, each an independent toggle, off by default): `mathGenerateOperand()` rolls whether any given operand becomes one of the enabled types instead of a plain number — `pow` renders as `base²`/`base³` (base 2-6, exp 2-3), `sqrt` as `√n` where `n` is a perfect square (root 2-7), `frac` as `a/b` where `a` is chosen to divide evenly by `b` (divisor 2-6, quotient 1-9). Every special operand's *value* is still a plain resolved integer, so the answer format (typed number or multiple-choice) never changes regardless of which types are on.
  - **Term count** (`settings.maxTerms`, 2-5 on the start screen): each problem rolls its own term count in `[MATH_TERM_MIN, maxTerms]`. A 2-term roll may become a `×` problem (preserving the original single-operator feel); any longer roll chains `+`/`−` only, left-to-right, deliberately never mixing in `×` — that keeps the expression unambiguous to evaluate at a glance instead of requiring operator-precedence rules mid-flash. Subtraction only fires when it won't take the running total negative (falls back to addition otherwise).
  Wrong/timeout/give-up ends the run and offers to restart immediately.
- **ซูโดกุ** (`tools/sudoku.js`): 9x9, pick a difficulty (ง่าย/กลาง/ยาก → 44/36/30 clues kept). `sudokuGeneratePuzzle()` fills a random full board (`sudokuFillRandom`, randomized backtracking) then removes cells one at a time, keeping each removal only if `sudokuCountSolutions()` (capped at 2) still finds exactly one solution — guarantees every generated puzzle has a unique solution. Tap a cell then a number-pad digit to fill; row/col/box conflicts highlight red in real time (`sudokuFindConflicts`); 3 hints/game reveal a cell from the stored solution; win = board full with zero conflicts. A "โน้ต" toggle switches the number pad into pencil-mark mode — tapping a digit toggles it in/out of that (still-empty) cell's mini 3x3 note grid instead of answering; answering a cell for real clears its notes and strips that number from same-row/col/box peers' notes (`sudokuPeerIndices`/`clearPeerNotes`). A small legend above the board (`.sudoku-legend`) labels each color: given clues in `--text`, your answers in `--accent`, notes in a fixed `--sudoku-note-color` literal (amber) — deliberately *not* tied to `--accent` like before, since notes-at-reduced-opacity read as just a dimmer shade of the same hue as your answers; the fixed amber reads as unmistakably different from both the neutral given-clue color and the theme's accent color in every theme. Best time per difficulty persisted.
- **2048** (`tools/2048.js`): slide-and-merge, board size selectable on the start screen — 4x4 through 8x8 (`G2048_SIZES`). `g2048Move(board, size, dir)` slides+merges each row/column once per move (`g2048SlideLine`); a new 2 (90%) or 4 (10%) tile spawns after every move that changes the board. Reaching a 2048 tile shows a one-time win overlay with a "เล่นต่อ" option to keep playing past it; no more empty cells and no adjacent equal pairs ends the game (`g2048CanMove`). Tile font size scales down for larger boards (`g2048FontSizeFor`, `--g2048-font`). Best score persisted per board size.
- **เกม 24** (`tools/game24.js`): a row of number chips; tap two, tap an operator (+ − × ÷), they collapse into one chip showing the result — repeat until one chip is left, then it's checked against the target. "ธรรมดา" is the classic 4-numbers-make-24 puzzle: `g24GenerateNormal()` keeps redrawing 4 random 1-9 numbers until `g24Solvable()` confirms at least one combination hits exactly 24 — that recursive solver tries every way to pairwise-reduce the numbers down to one value, which implicitly covers every possible parenthesization (reducing any two numbers first, in any order, covers every grouping), so every dealt hand is guaranteed solvable. "แอดวานซ์" lets you pick how many numbers are dealt (`settings.advCount`, 3-6) and how many digits the target has (`settings.advDigits`, 1-3) via `g24GenerateAdvanced()` — those combinations aren't solvability-checked, so passing only requires landing within `G24_ADV_TOLERANCE` (±5) of the target instead of an exact hit. Mid-game controls: "↩ ย้อนกลับ" undoes the last combine (a plain history stack of prior chip arrays), "⟲ เลขเดิม" resets back to the original dealt numbers (same target, fresh attempt), "🔀 สุ่มใหม่" deals an entirely new hand.

**New sub-game:** own `tools/yourgame.{js,css}` (register in `index.html` before `games-core.js`, and in `PRECACHE_URLS`), entry in `GAME_TABS`, dispatch branch in `renderGamesShell`.

### The "ดูดวง" app

Two modes, switched via `fortune-mode-row` tabs (state persisted in `toolhub.fortune`), see `renderFortune` in `tools/fortune.js`:

- **ประจำวัน (daily):** tap the orb for a random reading from `FORTUNE_DATA` (100 entries); redrawable as many times as you like via "ดูดวงอีกครั้ง" in the overlay, never repeating the immediately-previous id (`revealDaily`, same non-repeat logic as the original single-mode version). `FORTUNE_DATA` itself isn't hand-written; `buildFortuneData()` composes each entry from small phrase pools (`FORTUNE_TITLE_POOL` etc., sized 10/9/8/7/11) — those sizes are pairwise-coprime-ish so their LCM (27720) comfortably exceeds 100, guaranteeing every id 0-99 gets a mathematically distinct title/work/money/love/health combination without writing 100 full entries by hand. A `.fortune-category-row` of toggle chips (`FORTUNE_DAILY_CATEGORIES`) lets the user pick which of การงาน/การเงิน/ความรัก/สุขภาพ actually show in the card (`state.dailyCategories`, persisted; at least one must stay on — the toggle handler no-ops on the last active one). The history detail view always shows the full unfiltered card regardless of the current toggle state — the setting only affects new daily reveals, not past ones.
- **เฉพาะเรื่อง (topic):** pick a topic (`FORTUNE_TOPICS`, 8 total: การงาน/การเงิน/ความรัก/สุขภาพ/การเรียน/การเดินทาง/ครอบครัว/โชคลาภ) to get a longer, hand-written detailed reading from `FORTUNE_TOPIC_DATA[topicId]` (title + detail paragraph + a tip line), avoiding an immediate repeat of the same topic's last-shown id. A "สุ่มใหม่" button in the overlay re-rolls within the same topic.

Both modes reuse `showFortuneOverlay(cardHtml, nextLabel, onNext)` (a `reveal-overlay`) — `fortuneCardHtml(f, categories)` renders the daily card (rows filtered by `categories`, defaulting to all-shown when omitted), `fortuneTopicCardHtml()` the detailed single-topic card. After any reveal, `fortuneApplyTint()` tints `.fortune-wrap`'s background toward that card's `luckyColor.hex` on top of a fixed dark base (`FORTUNE_BG_BASE`, `fortuneHexToRgba` for the glow) — a 2-stop radial gradient (alpha 0.85 at center → 0.5 at 32% → fading to the dark base by 78%) so the lucky color reads unmistakably rather than as a faint wash. `.fortune-wrap`'s background is always this fixed dark tone regardless of the selected theme (an intentional exception, not theme-following: the mystical backdrop is the screen's own flavor, same idea as the reveal-overlay's own fixed dark backdrop elsewhere in the app). Anything drawn directly on it without its own themed card background (`.fortune-hint`, `.fortune-category-btn`) uses a fixed light color instead of `var(--sub)` to stay readable in every theme.

**History:** every reveal in either mode pushes onto one combined `state.history` (`fortuneHistoryPush`, newest first, capped at `FORTUNE_HISTORY_MAX` = 30, each entry tagged `type: "daily"|"topic"`) — a `📜 ประวัติ` button (with a per-mode live count badge) pinned to the bottom of the screen via `margin-top: auto` (`.fortune-history-fab`, kept separate from the mode-tabs row on purpose) opens `showFortuneHistoryOverlay(state, mode, draw)`, which filters the shared array down to just the mode it was opened from — the daily screen's button only ever shows daily entries, the topic screen's only topic entries. Per-item delete (×) and "ล้างประวัติ" (scoped to that mode only) mutate `state.history` directly and re-render the list in place (`renderList()`, mirrors `showHuayHistoryOverlay`'s pattern) rather than closing/reopening the overlay, so the badge count behind it stays in sync via `draw()`. `fortuneHistoryResolve(h)` turns a `{type: "daily", id}` or `{type: "topic", topic, id}` history entry back into its display info and full (unfiltered) card HTML — tapping an entry reopens that exact card via `showFortuneOverlay` (read-only, no "next" button).

### Fullscreen "reveal" overlays

Ohana/ไพ่สุ่ม/สุ่ม/Flash Quiz/หวย/บวก-ลบ's name popup all use the same pattern: a full-viewport `position:fixed` div appended to `document.body`, animated in via a class toggle, removed on tap (`showOhanaOverlay`, `showRcOverlay`, `showWheelOverlay`, `showDiceOverlay`, `showQuizOverlay`, `showHuayOverlay`, `showCounterNameOverlay`). House style for every card/question "open" action — exact trigger code + the `reveal-overlay` class requirement are in CLAUDE.md's overlay rule; copy an existing `show*Overlay` rather than reimplementing.

### Layout: the flex chain must not break

`#app → .tool-screen → .tool-body → <tool wrapper>` is `flex:1; display:flex; flex-direction:column` at every link — each one also needs `min-height: 0`, or a content-less child collapses to zero height. Check this first if new content isn't filling the screen.

### Persistence — everything is `localStorage`, no backend

| key | shape | used by |
|---|---|---|
| `toolhub.counter` | `{ value, step, history: [{delta, time, isReset?}], showHistory, historyPinned, names: [{name, total}], showNames, namesPinned }` | บวก/ลบ — `history` logs +/− taps and resets; `names` is the ให้/ได้ ledger; `*Pinned` gates auto-close on the next +/− |
| `toolhub.todo` | `{ items: [{id, text, done, date?, subject?}] }` | สิ่งที่ต้องทำ — both the full screen and the Home preview |
| `toolhub.wonglao` | one object — see `WONGLAO_DEFAULT_STATE` | all 5 wonglao sub-games |
| `toolhub.huay` | `{ digits, last, history: [{value, digits, time}] }` | หวย — `history` is newest-first, capped at `HUAY_HISTORY_MAX` (30), viewable via the "ประวัติ" button (`showHuayHistoryOverlay(state, draw)`, live-state reference — per-item delete (×) or clear-all, both re-render the list in place without closing the overlay); `loadHuayState()` migrates a pre-split `huayDigits`/`huayLast` out of `toolhub.wonglao` on first read if `toolhub.huay` doesn't exist yet |
| `toolhub.fortune` | `{ mode: "daily"\|"topic", dailyLastId: number\|null, topicLast: {topic, id}\|null, dailyCategories: {work,money,love,health: boolean}, history: [{type, id, topic?, time}] }` | ดูดวง — `dailyLastId`/`topicLast` are just the last-shown card per mode (for the "ผลล่าสุด" preview + no-immediate-repeat check), not a daily lock — both modes are redrawable anytime; `dailyCategories` controls which rows show on new daily reveals (defaults all-true, merged per-field on load so old saves don't break); `history` is one combined newest-first log across both modes (capped at 30) but the "ประวัติ" overlay always filters it down to whichever mode it was opened from, including per-item delete and mode-scoped clear-all |
| `toolhub.hikeprep.<YYYY-MM-DD>` | `"1"`/`"0"` | เตรียมเดินป่า per-day checkbox |
| `toolhub.memories` | `{ viewOnly: boolean, books: [{id, name, details, cover, createdAt, pages: [{id, text, photo, impression, date, time, location, createdAt}]}] }` | ความทรงจำ — page/cover photos are base64 JPEG, pre-resized client-side via `memoriesReadImage` (canvas, `MEMORIES_PHOTO_MAX_DIM`/`MEMORIES_PHOTO_QUALITY`) before being stored; `viewOnly` gates whether tapping a page opens its editor or just turns the spread |
| `toolhub.games` | `{ tab }` | เกม hub — which sub-game tab is active |
| `toolhub.quickstart` | `string[]` of `APPS` ids | ทางลัด — which APPS entries are pinned to the Home quick-start widget |
| `toolhub.snake.highScore` | number string | งู high score |
| `toolhub.jumpking.highScore` | number string | Jump King best height score |
| `toolhub.mathquiz.bestStreak` | number string | คิดเลขเร็ว best streak |
| `toolhub.mathquiz.settings` | `{ mode: "type"\|"choice", choiceCount, startLevel: 0-6, maxTerms: 2-5, ops: {pow, sqrt, frac} }` | คิดเลขเร็ว answer-mode, difficulty, term-count, and special-operand preferences |
| `toolhub.sudoku.settings` | `{ difficulty: "easy"\|"medium"\|"hard" }` | ซูโดกุ difficulty preference |
| `toolhub.sudoku.bestTime` | `{ easy, medium, hard }` (seconds or null) | ซูโดกุ best time per difficulty |
| `toolhub.game2048.settings` | `{ size: 4-8 }` | 2048 board-size preference |
| `toolhub.game2048.bestScore` | `{ "4": best, ..., "8": best }` | 2048 best score per board size (older installs had a single number for 4x4 — migrated in on first read) |
| `toolhub.game24.settings` | `{ mode: "normal"\|"advanced", advDigits: 1-3, advCount: 3-6 }` | เกม 24 mode + advanced-mode preferences |
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
