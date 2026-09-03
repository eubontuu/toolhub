// เกม — tab-bar shell for mini-games (งู, Jump King). Mirrors วงเหล้า's persistent
// single-row tab-bar pattern (renderWongLaoShell in wonglao-core.js) but scoped to just
// these games, with its own state/CSS — not shared with wonglao.

const GAME_TABS = [
  { id: "snake", label: "งู", icon: "🐍" },
  { id: "jumpking", label: "Jump King", icon: "🤴" },
  { id: "mathquiz", label: "คิดเลขเร็ว", icon: "🧮" },
  { id: "sudoku", label: "ซูโดกุ", icon: "🧩" },
  { id: "2048", label: "2048", icon: "🔢" },
  { id: "game24", label: "เกม 24", icon: "🎯" },
];

const GAMES_DEFAULT_STATE = { tab: null };

function loadGamesState() {
  try {
    const raw = localStorage.getItem("toolhub.games");
    if (raw) return { ...GAMES_DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...GAMES_DEFAULT_STATE };
}

function saveGamesState(state) {
  localStorage.setItem("toolhub.games", JSON.stringify(state));
}

let gameTabbarHidden = false;

function renderGames(container) {
  const state = loadGamesState();
  if (!GAME_TABS.some((t) => t.id === state.tab)) {
    state.tab = GAME_TABS[0].id;
    saveGamesState(state);
  }

  function draw() {
    renderGamesShell(container, state, draw);
  }

  draw();
}

function renderGamesShell(container, state, draw) {
  container.innerHTML = `
    <div class="game-shell">
      <div class="game-tabbar-row ${gameTabbarHidden ? "hidden" : ""}" id="gameTabbarRow">
        <button class="game-tab-nudge" id="gameNudgeLeft" aria-label="เลื่อนซ้าย">‹</button>
        <div class="game-tabbar" id="gameTabbar">
          ${GAME_TABS.map(
            (t) => `
          <button class="game-tab ${t.id === state.tab ? "active" : ""}" data-tab-id="${t.id}">
            <span>${t.icon}</span><span>${t.label}</span>
          </button>`
          ).join("")}
        </div>
        <button class="game-tab-nudge" id="gameNudgeRight" aria-label="เลื่อนขวา">›</button>
      </div>
      <div class="game-tabbar-actions">
        <button class="game-tabbar-toggle" id="gameTabbarToggle">${gameTabbarHidden ? "▾ แถบเกม" : "▴ ซ่อนแถบ"}</button>
        <button class="game-tabbar-toggle" id="gameShowAllBtn">🔳 เกมทั้งหมด</button>
      </div>
      <div class="game-body" id="gameBody"></div>
    </div>
  `;

  container.querySelectorAll(".game-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tabId === state.tab) return;
      state.tab = btn.dataset.tabId;
      saveGamesState(state);
      draw();
    });
  });

  const tabbar = container.querySelector("#gameTabbar");
  container.querySelector("#gameNudgeLeft").addEventListener("click", () => {
    tabbar.scrollBy({ left: -120, behavior: "smooth" });
  });
  container.querySelector("#gameNudgeRight").addEventListener("click", () => {
    tabbar.scrollBy({ left: 120, behavior: "smooth" });
  });

  container.querySelector("#gameTabbarToggle").addEventListener("click", () => {
    gameTabbarHidden = !gameTabbarHidden;
    draw();
  });

  container.querySelector("#gameShowAllBtn").addEventListener("click", () => {
    showGameAllOverlay(state.tab, (tabId) => {
      if (tabId === state.tab) return;
      state.tab = tabId;
      saveGamesState(state);
      draw();
    });
  });

  const body = container.querySelector("#gameBody");
  if (state.tab === "snake") renderSnake(body);
  else if (state.tab === "jumpking") renderJumpKing(body);
  else if (state.tab === "mathquiz") renderMathQuiz(body);
  else if (state.tab === "sudoku") renderSudoku(body);
  else if (state.tab === "2048") render2048(body);
  else renderGame24(body);
}

// Full-screen grid of every เกม tab — opened via "เกมทั้งหมด" next to the tabbar toggle.
// Tap a tile to switch (onPick), tap empty space to close without switching.
function showGameAllOverlay(activeTabId, onPick) {
  const overlay = document.createElement("div");
  overlay.className = "game-all-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="game-all-grid">
      ${GAME_TABS.map(
        (t) => `
      <button class="game-all-tile ${t.id === activeTabId ? "active" : ""}" data-tab-id="${t.id}">
        <span class="game-all-tile-icon">${t.icon}</span><span>${t.label}</span>
      </button>`
      ).join("")}
    </div>
    <div class="game-all-hint">แตะพื้นที่ว่างเพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".game-all-grid").addEventListener("click", (e) => e.stopPropagation());
  overlay.querySelectorAll(".game-all-tile").forEach((btn) => {
    btn.addEventListener("click", () => {
      overlay.remove();
      onPick(btn.dataset.tabId);
    });
  });
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
