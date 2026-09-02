// 2048 — tab in the เกม hub (registered in GAME_TABS, tools/games-core.js).
// Classic slide-and-merge on a 4x4 grid. Swipe the board or use the on-screen arrows.
// No dependency on other tool files.

const G2048_BEST_KEY = "toolhub.game2048.bestScore";
const G2048_SIZE = 4;
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

function loadG2048Best() {
  try {
    return parseInt(localStorage.getItem(G2048_BEST_KEY) || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

function saveG2048Best(v) {
  try {
    localStorage.setItem(G2048_BEST_KEY, String(v));
  } catch (e) {}
}

function g2048EmptyBoard() {
  return new Array(G2048_SIZE * G2048_SIZE).fill(0);
}

function g2048GetRow(board, r) {
  return [0, 1, 2, 3].map((c) => board[r * G2048_SIZE + c]);
}
function g2048SetRow(board, r, line) {
  for (let c = 0; c < G2048_SIZE; c++) board[r * G2048_SIZE + c] = line[c];
}
function g2048GetCol(board, c) {
  return [0, 1, 2, 3].map((r) => board[r * G2048_SIZE + c]);
}
function g2048SetCol(board, c, line) {
  for (let r = 0; r < G2048_SIZE; r++) board[r * G2048_SIZE + c] = line[r];
}
function g2048ArraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function g2048SlideLine(line) {
  const nums = line.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) {
      nums[i] *= 2;
      gained += nums[i];
      nums.splice(i + 1, 1);
    }
  }
  while (nums.length < G2048_SIZE) nums.push(0);
  return { line: nums, gained };
}

function g2048Move(board, dir) {
  let changed = false;
  let gained = 0;
  const horizontal = dir === "left" || dir === "right";
  for (let i = 0; i < G2048_SIZE; i++) {
    const before = horizontal ? g2048GetRow(board, i) : g2048GetCol(board, i);
    const reversed = dir === "right" || dir === "down";
    let line = reversed ? before.slice().reverse() : before.slice();
    const res = g2048SlideLine(line);
    let after = reversed ? res.line.slice().reverse() : res.line;
    if (!g2048ArraysEqual(after, before)) changed = true;
    gained += res.gained;
    if (horizontal) g2048SetRow(board, i, after);
    else g2048SetCol(board, i, after);
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

function g2048CanMove(board) {
  if (board.some((v) => v === 0)) return true;
  for (let r = 0; r < G2048_SIZE; r++) {
    for (let c = 0; c < G2048_SIZE; c++) {
      const v = board[r * G2048_SIZE + c];
      if (c < G2048_SIZE - 1 && board[r * G2048_SIZE + c + 1] === v) return true;
      if (r < G2048_SIZE - 1 && board[(r + 1) * G2048_SIZE + c] === v) return true;
    }
  }
  return false;
}

function render2048(container) {
  let best = loadG2048Best();

  container.innerHTML = `
    <div class="g2048-body">
      <div class="g2048-score-row">
        <span>คะแนน <b id="g2048Score">0</b></span>
        <span>สูงสุด <b id="g2048Best">${best}</b></span>
      </div>
      <div class="g2048-board-wrap">
        <div class="g2048-grid" id="g2048Grid"></div>
        <div class="g2048-overlay show" id="g2048Overlay">
          <div class="g2048-overlay-title" id="g2048OverlayTitle">🔢 2048</div>
          <div class="g2048-overlay-sub" id="g2048OverlaySub">ปัดหรือกดปุ่มลูกศรเพื่อเลื่อนตัวเลข ตัวเลขเท่ากันชนกันจะรวมกันเป็นสองเท่า ทำให้ถึง 2048 ให้ได้</div>
          <button class="g2048-start-btn" id="g2048StartBtn">เริ่มเกม</button>
        </div>
      </div>
      <div class="g2048-controls">
        <div class="g2048-dpad">
          <button class="g2048-dpad-btn g2048-dpad-up" id="g2048Up">▲</button>
          <button class="g2048-dpad-btn g2048-dpad-left" id="g2048Left">◀</button>
          <button class="g2048-dpad-btn g2048-dpad-down" id="g2048Down">▼</button>
          <button class="g2048-dpad-btn g2048-dpad-right" id="g2048Right">▶</button>
        </div>
        <button class="g2048-new-btn" id="g2048NewBtn">เกมใหม่</button>
      </div>
    </div>
  `;

  const grid = container.querySelector("#g2048Grid");
  const overlay = container.querySelector("#g2048Overlay");
  const overlayTitle = container.querySelector("#g2048OverlayTitle");
  const overlaySub = container.querySelector("#g2048OverlaySub");
  const startBtn = container.querySelector("#g2048StartBtn");
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

  function resetGame() {
    board = g2048EmptyBoard();
    g2048AddRandomTile(board);
    g2048AddRandomTile(board);
    score = 0;
    running = true;
    wonShown = false;
    scoreEl.textContent = "0";
    overlay.classList.remove("show");
    drawBoard();
  }

  function doMove(dir) {
    if (!running) return;
    const result = g2048Move(board, dir);
    if (!result.changed) return;
    score += result.gained;
    scoreEl.textContent = String(score);
    if (score > best) {
      best = score;
      saveG2048Best(best);
      bestEl.textContent = String(best);
    }
    g2048AddRandomTile(board);
    drawBoard();

    if (!wonShown && board.some((v) => v >= 2048)) {
      wonShown = true;
      running = false;
      overlayTitle.textContent = "🎉 ถึง 2048 แล้ว!";
      overlaySub.textContent = `ได้ ${score} คะแนน — กดเพื่อเล่นต่อหรือเริ่มใหม่`;
      startBtn.textContent = "เล่นต่อ";
      overlay.classList.add("show");
      return;
    }

    if (!g2048CanMove(board)) {
      running = false;
      overlayTitle.textContent = "😵 จบเกม";
      overlaySub.textContent = `ได้ ${score} คะแนน — กดเพื่อเล่นใหม่`;
      startBtn.textContent = "เล่นอีกครั้ง";
      overlay.classList.add("show");
    }
  }

  startBtn.addEventListener("click", () => {
    if (wonShown && board.some((v) => v >= 2048) && g2048CanMove(board)) {
      running = true;
      overlay.classList.remove("show");
      return;
    }
    resetGame();
  });
  container.querySelector("#g2048NewBtn").addEventListener("click", resetGame);
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

  board = g2048EmptyBoard();
  running = false;
  wonShown = false;
  drawBoard();
}
