// วงเหล้า — shared state, menu/router, and shuffleArray util
// Must load before the other tools/wonglao-*.js files: they call saveWongLaoState/shuffleArray.

const WONGLAO_TABS = [
  { id: "ohana", label: "ไพ่ Ohana", icon: "🃏", iconImg: "icons/emoji/joker.svg" },
  { id: "randomcard", label: "ไพ่สุ่ม", icon: "🎴", iconImg: "icons/emoji/flower-card.svg" },
  { id: "wheel", label: "สุ่ม", icon: "🎡", iconImg: "icons/emoji/ferris-wheel.svg" },
  { id: "chwazi", label: "Chwazi", icon: "🖐️", iconImg: "icons/emoji/hand.svg" },
  { id: "quiz", label: "Flash Quiz", icon: "⚡", iconImg: "icons/emoji/zap.svg" },
];

function tabIconHtml(item, className) {
  return item.iconImg ? `<img src="${item.iconImg}" alt="${item.label}" class="${className}" />` : item.icon;
}

const WONGLAO_DEFAULT_STATE = {
  tab: null,
  ohanaDeck: null,
  ohanaLast: null,
  rcQuantity: 50,
  rcCustom: [],
  rcExcluded: [],
  rcDeck: null,
  rcLast: null,
  rcStarted: false,
  rcShowList: false,
  wheelMode: "number",
  wheelMax: 6,
  wheelLast: null,
  diceCount: 2,
  diceLast: null,
  chwaziWinnerCount: 1,
  quizDeck: null,
  quizLast: null,
};

function loadWongLaoState() {
  try {
    const raw = localStorage.getItem("toolhub.wonglao");
    if (raw) return { ...WONGLAO_DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...WONGLAO_DEFAULT_STATE };
}

function saveWongLaoState(state) {
  localStorage.setItem("toolhub.wonglao", JSON.stringify(state));
}

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderWongLao(container) {
  const state = loadWongLaoState();

  function draw() {
    if (!state.tab) {
      renderWongLaoMenu(container, state, draw);
    } else {
      renderWongLaoGame(container, state, draw);
    }
  }

  draw();
}

function renderWongLaoMenu(container, state, draw) {
  container.innerHTML = `
    <div class="wl-menu">
      <div class="grid" id="wlGrid"></div>
    </div>
  `;
  const grid = container.querySelector("#wlGrid");
  WONGLAO_TABS.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "icon-btn";
    btn.innerHTML = `<div class="icon-tile">${tabIconHtml(t, "icon-img")}</div><div class="icon-label">${t.label}</div>`;
    btn.addEventListener("click", () => {
      state.tab = t.id;
      saveWongLaoState(state);
      draw();
    });
    grid.appendChild(btn);
  });
}

function renderWongLaoGame(container, state, draw) {
  const meta = WONGLAO_TABS.find((t) => t.id === state.tab);
  if (!meta) {
    // stale/removed tab id from an older install — fall back to the menu instead of crashing
    state.tab = null;
    saveWongLaoState(state);
    renderWongLaoMenu(container, state, draw);
    return;
  }
  container.innerHTML = `
    <div class="wl-game">
      <div class="wl-game-header">
        <button class="back-btn" id="wlBack">‹</button>
        <div class="wl-game-title">${tabIconHtml(meta, "wl-game-title-icon")} ${meta.label}</div>
      </div>
      <div class="wl-game-body" id="wlGameBody"></div>
    </div>
  `;
  container.querySelector("#wlBack").addEventListener("click", () => {
    state.tab = null;
    saveWongLaoState(state);
    draw();
  });

  const body = container.querySelector("#wlGameBody");
  if (state.tab === "ohana") renderOhanaGame(body, state);
  else if (state.tab === "randomcard") renderRandomCardGame(body, state);
  else if (state.tab === "wheel") renderWheelGame(body, state);
  else if (state.tab === "chwazi") renderChwaziGame(body, state);
  else renderFlashQuizGame(body, state);
}
