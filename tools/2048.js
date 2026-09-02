// 2048 — tab in the เกม hub (registered in GAME_TABS, tools/games-core.js).
// Classic slide-and-merge, board size selectable (4x4 to 8x8) on the start screen. Swipe
// the board or use the on-screen arrows. No dependency on other tool files.

const G2048_BEST_KEY = "toolhub.game2048.bestScore";
const G2048_SETTINGS_KEY = "toolhub.game2048.settings";
const G2048_SIZES = [4, 5, 6, 7, 8];
const G2048_TILE_COLORS = {
  2: { bg: "#eee4da", fg: "#5d5347" },
  4: { bg: "#ede0c8", fg: "#5d5347" },
  8: { bg: "#f2b179", fg: "#fff" },
  16: { bg: "#f59563", fg: "#fff" },
  32: { bg: "#f67c5f", fg: "#fff" },
  64: { bg: "#f65e3b", fg: "#fff" },
  128: { bg: "#edcf72", fg: "#fff" },
  256: { bg: "#edcc61", fg: "#fff" },
  512: { bg: "#edc850", fg: "#fff" },
  1024: { bg: "#edc53f", fg: "#fff" },
  2048: { bg: "#edc22e", fg: "#fff" },
};
const G2048_TILE_FALLBACK = { bg: "#3c3a32", fg: "#fff" };

function loadG2048Settings() {
  try {
    const raw = localStorage.getItem(G2048_SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (G2048_SIZES.includes(s.size)) return { size: s.size };
    }
  } catch (e) {}
  return { size: 4 };
}

function saveG2048Settings(settings) {
  localStorage.setItem(G2048_SETTINGS_KEY, JSON.stringify(settings));
}

// Stored per board size: { "4": best, "5": best, ... }. Older installs had a single number
// (4x4-only best) — migrate that into size 4 on first read.
function loadG2048Best() {
  const best = {};
  G2048_SIZES.forEach((s) => (best[s] = 0));
  try {
    const raw = localStorage.getItem(G2048_BEST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "number") best[4] = parsed;
      else G2048_SIZES.forEach((s) => (best[s] = typeof parsed[s] === "number" ? parsed[s] : 0));
    }
  } catch (e) {}
  return best;
}

function saveG2048Best(best) {
  localStorage.setItem(G2048_BEST_KEY, JSON.stringify(best));
}

function g2048EmptyBoard(size) {
  return new Array(size * size).fill(0);
}

function g2048GetRow(board, size, r) {
  return Array.from({ length: size }, (_, c) => board[r * size + c]);
}
function g2048SetRow(board, size, r, line) {
  for (let c = 0; c < size; c++) board[r * size + c] = line[c];
}
function g2048GetCol(board, size, c) {
  return Array.from({ length: size }, (_, r) => board[r * size + c]);
}
function g2048SetCol(board, size, c, line) {
  for (let r = 0; r < size; r++) board[r * size + c] = line[r];
}
function g2048ArraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function g2048SlideLine(line, size) {
  const nums = line.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) {
      nums[i] *= 2;
      gained += nums[i];
      nums.splice(i + 1, 1);
    }
  }
  while (nums.length < size) nums.push(0);
  return { line: nums, gained };
}

function g2048Move(board, size, dir) {
  let changed = false;
  let gained = 0;
  const horizontal = dir === "left" || dir === "right";
  for (let i = 0; i < size; i++) {
    const before = horizontal ? g2048GetRow(board, size, i) : g2048GetCol(board, size, i);
    const reversed = dir === "right" || dir === "down";
    let line = reversed ? before.slice().reverse() : before.slice();
    const res = g2048SlideLine(line, size);
    let after = reversed ? res.line.slice().reverse() : res.line;
    if (!g2048ArraysEqual(after, before)) changed = true;
    gained += res.gained;
    if (horizontal) g2048SetRow(board, size, i, after);
    else g2048SetCol(board, size, i, after);
  }
  return { changed, gained };
}

function g2048AddRandomTile(board) {
  const empty = [];
  board.forEach((v, i) => {
    if (v === 0) empty.push(i);
  });
  if (empty.length === 0) return;
  const idx = empty[Math.floor(Math.random() * empty.length)];
  board[idx] = Math.random() < 0.9 ? 2 : 4;
}

function g2048CanMove(board, size) {
  if (board.some((v) => v === 0)) return true;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = board[r * size + c];
      if (c < size - 1 && board[r * size + c + 1] === v) return true;
      if (r < size - 1 && board[(r + 1) * size + c] === v) return true;
    }
  }
  return false;
}

function g2048FontSizeFor(size) {
  if (size <= 4) return 24;
  if (size === 5) return 20;
  if (size === 6) return 17;
  if (size === 7) return 15;
  return 13;
}

function render2048(container) {
  const settings = loadG2048Settings();
  const bestScores = loadG2048Best();

  function showIdle() {
    container.innerHTML = `
      <div class="g2048-body">
        <div class="g2048-idle">
          <div class="g2048-idle-title">🔢 2048</div>
          <div class="g2048-idle-sub">เลือกขนาดกระดาน แล้วเริ่มเล่นได้เลย</div>
          <div class="g2048-size-row">
            ${G2048_SIZES.map(
              (s) => `<button class="g2048-size-btn ${settings.size === s ? "active" : ""}" data-size="${s}">${s}×${s}</button>`
            ).join("")}
          </div>
          <div class="g2048-best-line">${bestScores[settings.size] ? `สถิติ: ${bestScores[settings.size]}` : "ยังไม่มีสถิติ"}</div>
          <button class="g2048-start-btn" id="g2048StartBtn">เริ่มเกม</button>
        </div>
      </div>
    `;
    container.querySelectorAll(".g2048-size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.size = Number(btn.dataset.size);
        saveG2048Settings(settings);
        showIdle();
      });
    });
    container.querySelector("#g2048StartBtn").addEventListener("click", startGame);
  }

  function startGame() {
    const size = settings.size;

    container.innerHTML = `
      <div class="g2048-body">
        <div class="g2048-score-row">
          <span>คะแนน <b id="g2048Score">0</b></span>
          <span>สูงสุด <b id="g2048Best">${bestScores[size]}</b></span>
          <button class="g2048-new-btn" id="g2048NewBtn">เกมใหม่</button>
        </div>
        <div class="g2048-board-wrap">
          <div class="g2048-grid" id="g2048Grid"></div>
          <div class="g2048-overlay" id="g2048Overlay">
            <div class="g2048-overlay-title" id="g2048OverlayTitle"></div>
            <div class="g2048-overlay-sub" id="g2048OverlaySub"></div>
            <div class="g2048-overlay-actions" id="g2048OverlayActions"></div>
          </div>
        </div>
        <div class="g2048-dpad">
          <button class="g2048-dpad-btn g2048-dpad-up" id="g2048Up">▲</button>
          <button class="g2048-dpad-btn g2048-dpad-left" id="g2048Left">◀</button>
          <button class="g2048-dpad-btn g2048-dpad-down" id="g2048Down">▼</button>
          <button class="g2048-dpad-btn g2048-dpad-right" id="g2048Right">▶</button>
        </div>
      </div>
    `;

    const grid = container.querySelector("#g2048Grid");
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    grid.style.gap = size >= 7 ? "4px" : "8px";
    grid.style.setProperty("--g2048-font", g2048FontSizeFor(size) + "px");

    const overlay = container.querySelector("#g2048Overlay");
    const overlayTitle = container.querySelector("#g2048OverlayTitle");
    const overlaySub = container.querySelector("#g2048OverlaySub");
    const overlayActions = container.querySelector("#g2048OverlayActions");
    const scoreEl = container.querySelector("#g2048Score");
    const bestEl = container.querySelector("#g2048Best");

    let board, score, running, wonShown;

    function drawBoard() {
      grid.innerHTML = board
        .map((v) => {
          if (v === 0) return `<div class="g2048-cell"></div>`;
          const colors = G2048_TILE_COLORS[v] || G2048_TILE_FALLBACK;
          const small = v >= 1000 ? " g2048-cell-small" : "";
          return `<div class="g2048-cell g2048-tile${small}" style="background:${colors.bg};color:${colors.fg}">${v}</div>`;
        })
        .join("");
    }

    function resetBoard() {
      board = g2048EmptyBoard(size);
      g2048AddRandomTile(board);
      g2048AddRandomTile(board);
      score = 0;
      running = true;
      wonShown = false;
      scoreEl.textContent = "0";
      overlay.classList.remove("show");
      drawBoard();
    }

    function showOverlay(title, sub, actions) {
      overlayTitle.textContent = title;
      overlaySub.textContent = sub;
      overlayActions.innerHTML = actions
        .map((a, i) => `<button class="g2048-start-btn" data-action="${i}">${a.label}</button>`)
        .join("");
      overlayActions.querySelectorAll("button").forEach((btn, i) => {
        btn.addEventListener("click", actions[i].onClick);
      });
      overlay.classList.add("show");
    }

    function doMove(dir) {
      if (!running) return;
      const result = g2048Move(board, size, dir);
      if (!result.changed) return;
      score += result.gained;
      scoreEl.textContent = String(score);
      if (score > bestScores[size]) {
        bestScores[size] = score;
        saveG2048Best(bestScores);
        bestEl.textContent = String(score);
      }
      g2048AddRandomTile(board);
      drawBoard();

      if (!wonShown && board.some((v) => v >= 2048)) {
        wonShown = true;
        running = false;
        showOverlay("🎉 ถึง 2048 แล้ว!", `ได้ ${score} คะแนน`, [
          { label: "เล่นต่อ", onClick: () => { running = true; overlay.classList.remove("show"); } },
          { label: "เกมใหม่", onClick: showIdle },
        ]);
        return;
      }

      if (!g2048CanMove(board, size)) {
        running = false;
        showOverlay("😵 จบเกม", `ได้ ${score} คะแนน`, [
          { label: "เล่นอีกครั้ง", onClick: resetBoard },
          { label: "เปลี่ยนขนาด", onClick: showIdle },
        ]);
      }
    }

    container.querySelector("#g2048NewBtn").addEventListener("click", showIdle);
    container.querySelector("#g2048Up").addEventListener("click", () => doMove("up"));
    container.querySelector("#g2048Down").addEventListener("click", () => doMove("down"));
    container.querySelector("#g2048Left").addEventListener("click", () => doMove("left"));
    container.querySelector("#g2048Right").addEventListener("click", () => doMove("right"));

    let touchStartX = 0;
    let touchStartY = 0;
    grid.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      },
      { passive: true }
    );
    grid.addEventListener(
      "touchend",
      (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
        if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
        else doMove(dy > 0 ? "down" : "up");
      },
      { passive: true }
    );

    resetBoard();
  }

  showIdle();
}
