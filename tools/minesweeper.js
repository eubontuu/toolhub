// กู้ระเบิด (Minesweeper) — classic 9x9/10-mine board, tab in the เกม hub (registered
// in GAME_TABS, tools/games-core.js). No dependency on other tool files.

const MINE_COLS = 9;
const MINE_ROWS = 9;
const MINE_COUNT = 10;
const MINE_BEST_KEY = "toolhub.minesweeper.bestTime";

function loadMineBest() {
  try {
    const raw = localStorage.getItem(MINE_BEST_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch (e) {
    return null;
  }
}

function saveMineBest(seconds) {
  try {
    localStorage.setItem(MINE_BEST_KEY, String(seconds));
  } catch (e) {}
}

const MINE_NUMBER_COLOR = {
  1: "#4c8dff",
  2: "#2e8b57",
  3: "#e74c3c",
  4: "#8e44ad",
  5: "#b8860b",
  6: "#17a2b8",
  7: "#6b7280",
  8: "#9aa1ac",
};

function renderMinesweeper(container) {
  const TOTAL = MINE_COLS * MINE_ROWS;
  let best = loadMineBest();

  container.innerHTML = `
    <div class="mine-body">
      <div class="mine-score-row">
        <span>เหลือ <b id="mineCount">${MINE_COUNT}</b></span>
        <span>เวลา <b id="mineTimer">0</b> วิ</span>
        <span>สถิติ <b id="mineBest">${best === null ? "-" : best}</b></span>
      </div>
      <div class="mine-board-wrap">
        <div class="mine-grid" id="mineGrid" style="grid-template-columns: repeat(${MINE_COLS}, 1fr);"></div>
        <div class="mine-overlay" id="mineOverlay">
          <div class="mine-overlay-title" id="mineOverlayTitle"></div>
          <div class="mine-overlay-sub" id="mineOverlaySub"></div>
          <button class="mine-start-btn" id="mineRestartBtn">เล่นใหม่</button>
        </div>
      </div>
      <div class="mine-controls">
        <button class="mine-flag-toggle" id="mineFlagToggle">🚩 โหมดปักธง</button>
        <button class="mine-newgame-btn" id="mineNewGameBtn">🔄 เกมใหม่</button>
      </div>
    </div>
  `;

  const grid = container.querySelector("#mineGrid");
  const overlay = container.querySelector("#mineOverlay");
  const overlayTitle = container.querySelector("#mineOverlayTitle");
  const overlaySub = container.querySelector("#mineOverlaySub");
  const countEl = container.querySelector("#mineCount");
  const timerEl = container.querySelector("#mineTimer");
  const bestEl = container.querySelector("#mineBest");
  const flagToggleBtn = container.querySelector("#mineFlagToggle");

  let mines, revealed, flagged, adjacent, started, over, flagMode, revealedCount, flagCount, elapsed, timer;

  function neighbors(i) {
    const row = Math.floor(i / MINE_COLS);
    const col = i % MINE_COLS;
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < MINE_ROWS && c >= 0 && c < MINE_COLS) out.push(r * MINE_COLS + c);
      }
    }
    return out;
  }

  function resetGame() {
    removeLongPressMenu();
    mines = new Array(TOTAL).fill(false);
    revealed = new Array(TOTAL).fill(false);
    flagged = new Array(TOTAL).fill(false);
    adjacent = new Array(TOTAL).fill(0);
    started = false;
    over = false;
    flagMode = false;
    revealedCount = 0;
    flagCount = 0;
    elapsed = 0;
    clearInterval(timer);
    countEl.textContent = String(MINE_COUNT);
    timerEl.textContent = "0";
    overlay.classList.remove("show");
    flagToggleBtn.classList.remove("active");
    draw();
  }

  function placeMines(excludeIndex) {
    const excluded = new Set([excludeIndex, ...neighbors(excludeIndex)]);
    const candidates = [];
    for (let i = 0; i < TOTAL; i++) if (!excluded.has(i)) candidates.push(i);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    candidates.slice(0, MINE_COUNT).forEach((i) => (mines[i] = true));
    for (let i = 0; i < TOTAL; i++) {
      if (mines[i]) continue;
      adjacent[i] = neighbors(i).filter((n) => mines[n]).length;
    }
  }

  function startTimer() {
    timer = setInterval(() => {
      elapsed += 1;
      timerEl.textContent = String(elapsed);
    }, 1000);
  }

  function revealCell(startIndex) {
    const stack = [startIndex];
    while (stack.length) {
      const i = stack.pop();
      if (revealed[i] || flagged[i]) continue;
      revealed[i] = true;
      revealedCount++;
      if (adjacent[i] === 0 && !mines[i]) {
        neighbors(i).forEach((n) => {
          if (!revealed[n] && !flagged[n]) stack.push(n);
        });
      }
    }
  }

  function endGame(won) {
    over = true;
    clearInterval(timer);
    if (won) {
      if (best === null || elapsed < best) {
        best = elapsed;
        saveMineBest(best);
        bestEl.textContent = String(best);
      }
      overlayTitle.textContent = "🎉 กู้ระเบิดสำเร็จ";
      overlaySub.textContent = `ใช้เวลา ${elapsed} วิ`;
    } else {
      for (let i = 0; i < TOTAL; i++) if (mines[i]) revealed[i] = true;
      overlayTitle.textContent = "💥 เหยียบระเบิด";
      overlaySub.textContent = "กดเล่นใหม่ได้เลย";
    }
    draw();
    overlay.classList.add("show");
  }

  function doToggleFlag(i) {
    if (over || revealed[i]) return;
    if (flagged[i]) {
      flagged[i] = false;
      flagCount--;
    } else {
      flagged[i] = true;
      flagCount++;
    }
    countEl.textContent = String(MINE_COUNT - flagCount);
    draw();
  }

  function doReveal(i) {
    if (over || revealed[i] || flagged[i]) return;
    if (!started) {
      started = true;
      placeMines(i);
      startTimer();
    }
    if (mines[i]) {
      revealed[i] = true;
      endGame(false);
      return;
    }
    revealCell(i);
    draw();
    if (revealedCount === TOTAL - MINE_COUNT) endGame(true);
  }

  function tapCell(i) {
    if (over || revealed[i]) return;
    if (flagMode) {
      doToggleFlag(i);
      return;
    }
    if (flagged[i]) return;
    doReveal(i);
  }

  function cellContent(i) {
    if (flagged[i] && !revealed[i]) return "🚩";
    if (!revealed[i]) return "";
    if (mines[i]) return "💣";
    if (adjacent[i] === 0) return "";
    return String(adjacent[i]);
  }

  function draw() {
    grid.innerHTML = "";
    for (let i = 0; i < TOTAL; i++) {
      const btn = document.createElement("button");
      btn.className = "mine-cell";
      if (revealed[i]) btn.classList.add("revealed");
      if (revealed[i] && mines[i]) btn.classList.add("mine");
      if (revealed[i] && adjacent[i] > 0 && !mines[i]) {
        btn.style.color = MINE_NUMBER_COLOR[adjacent[i]];
      }
      btn.textContent = cellContent(i);
      btn.dataset.i = i;
      grid.appendChild(btn);
    }
  }

  const boardWrap = container.querySelector(".mine-board-wrap");
  const LONG_PRESS_MS = 450;
  let pressTimer = null;
  let suppressNextClick = false;

  function removeLongPressMenu() {
    const menu = boardWrap.querySelector("#mineLongpressMenu");
    const backdrop = boardWrap.querySelector("#mineLongpressBackdrop");
    if (menu) menu.remove();
    if (backdrop) backdrop.remove();
  }

  function showLongPressMenu(i, clientX, clientY) {
    if (over || revealed[i]) return;
    removeLongPressMenu();
    const wrapRect = boardWrap.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - wrapRect.left, 46), wrapRect.width - 46);
    const y = Math.min(Math.max(clientY - wrapRect.top, 20), wrapRect.height - 20);

    const backdrop = document.createElement("div");
    backdrop.className = "mine-longpress-backdrop";
    backdrop.id = "mineLongpressBackdrop";
    backdrop.addEventListener("click", removeLongPressMenu);
    boardWrap.appendChild(backdrop);

    const menu = document.createElement("div");
    menu.className = "mine-longpress-menu";
    menu.id = "mineLongpressMenu";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.innerHTML = `
      <button class="mine-longpress-btn" id="mineLpReveal">👆 เปิด</button>
      <button class="mine-longpress-btn" id="mineLpFlag">${flagged[i] ? "🚩 เอาธงออก" : "🚩 ปักธง"}</button>
    `;
    menu.querySelector("#mineLpReveal").addEventListener("click", (e) => {
      e.stopPropagation();
      removeLongPressMenu();
      doReveal(i);
    });
    menu.querySelector("#mineLpFlag").addEventListener("click", (e) => {
      e.stopPropagation();
      removeLongPressMenu();
      doToggleFlag(i);
    });
    boardWrap.appendChild(menu);
  }

  grid.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".mine-cell");
    if (!btn || over) return;
    const i = Number(btn.dataset.i);
    const clientX = e.clientX;
    const clientY = e.clientY;
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
      pressTimer = null;
      suppressNextClick = true;
      showLongPressMenu(i, clientX, clientY);
    }, LONG_PRESS_MS);
  });
  grid.addEventListener("pointerup", () => clearTimeout(pressTimer));
  grid.addEventListener("pointerleave", () => clearTimeout(pressTimer));
  grid.addEventListener("pointercancel", () => clearTimeout(pressTimer));

  grid.addEventListener("click", (e) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    const btn = e.target.closest(".mine-cell");
    if (!btn) return;
    tapCell(Number(btn.dataset.i));
  });

  flagToggleBtn.addEventListener("click", () => {
    flagMode = !flagMode;
    flagToggleBtn.classList.toggle("active", flagMode);
  });

  container.querySelector("#mineNewGameBtn").addEventListener("click", resetGame);
  container.querySelector("#mineRestartBtn").addEventListener("click", resetGame);

  resetGame();
}
