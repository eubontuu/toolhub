// เกม — tab-bar shell for mini-games (งู, Jump King). Mirrors วงเหล้า's persistent
// single-row tab-bar pattern (renderWongLaoShell in wonglao-core.js) but scoped to just
// these games, with its own state/CSS — not shared with wonglao.

const GAME_TABS = [
  { id: "snake", label: "งู", icon: "🐍" },
  { id: "jumpking", label: "Jump King", icon: "🤴" },
  { id: "mathquiz", label: "คิดเลขเร็ว", icon: "🧮" },
  { id: "sudoku", label: "ซูโดกุ", icon: "🧩" },
  { id: "2048", label: "2048", icon: "🔢" },
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
      <button class="game-tabbar-toggle" id="gameTabbarToggle">${gameTabbarHidden ? "▾ แถบเกม" : "▴ ซ่อนแถบ"}</button>
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

  const body = container.querySelector("#gameBody");
  if (state.tab === "snake") renderSnake(body);
  else if (state.tab === "jumpking") renderJumpKing(body);
  else if (state.tab === "mathquiz") renderMathQuiz(body);
  else if (state.tab === "sudoku") renderSudoku(body);
  else render2048(body);
}
