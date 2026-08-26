// วงเหล้า — shared state, menu/router, สุ่มคน game, and shuffleArray util
// Must load before the other tools/wonglao-*.js files: they call saveWongLaoState/shuffleArray.

const WONGLAO_TABS = [
  { id: "picker", label: "สุ่มคน", icon: "🎯", iconImg: "icons/emoji/dart.svg" },
  { id: "ohana", label: "ไพ่ Ohana", icon: "🃏", iconImg: "icons/emoji/joker.svg" },
  { id: "randomcard", label: "ไพ่สุ่ม", icon: "🎴", iconImg: "icons/emoji/flower-card.svg" },
  { id: "wheel", label: "สุ่มเลข", icon: "🎡", iconImg: "icons/emoji/ferris-wheel.svg" },
  { id: "chwazi", label: "Chwazi", icon: "🖐️", iconImg: "icons/emoji/hand.svg" },
  { id: "quiz", label: "Flash Quiz", icon: "⚡", iconImg: "icons/emoji/zap.svg" },
];

function tabIconHtml(item, className) {
  return item.iconImg ? `<img src="${item.iconImg}" alt="${item.label}" class="${className}" />` : item.icon;
}

const WONGLAO_DEFAULT_STATE = {
  tab: null,
  names: [],
  pickedName: null,
  ohanaDeck: null,
  ohanaLast: null,
  rcQuantity: 50,
  rcCustom: [],
  rcExcluded: [],
  rcDeck: null,
  rcLast: null,
  rcStarted: false,
  rcShowList: false,
  wheelMax: 6,
  wheelLast: null,
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
  if (state.tab === "picker") renderPickerGame(body, state);
  else if (state.tab === "ohana") renderOhanaGame(body, state);
  else if (state.tab === "randomcard") renderRandomCardGame(body, state);
  else if (state.tab === "wheel") renderWheelGame(body, state);
  else if (state.tab === "chwazi") renderChwaziGame(body, state);
  else renderFlashQuizGame(body, state);
}

function renderPickerGame(body, state) {
  body.innerHTML = `
    <div class="picker-wrap">
      <div class="picker-input-row">
        <input type="text" id="nameInput" placeholder="พิมพ์ชื่อแล้วกดเพิ่ม" />
        <button id="addNameBtn">เพิ่ม</button>
      </div>
      <div class="picker-list" id="nameList"></div>
      <button class="wl-action-btn" id="pickBtn" ${state.names.length < 2 ? "disabled" : ""}>สุ่มคนโดน</button>
      <div class="picker-result" id="pickerResult">${state.pickedName ? `🍻 ${state.pickedName} โดน!` : ""}</div>
    </div>
  `;

  const list = body.querySelector("#nameList");
  state.names.forEach((name, i) => {
    const chip = document.createElement("div");
    chip.className = "name-chip";
    chip.innerHTML = `<span>${name}</span><button data-i="${i}">×</button>`;
    list.appendChild(chip);
  });
  list.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.names.splice(Number(btn.dataset.i), 1);
      saveWongLaoState(state);
      renderPickerGame(body, state);
    });
  });

  body.querySelector("#addNameBtn").addEventListener("click", () => {
    const input = body.querySelector("#nameInput");
    const val = input.value.trim();
    if (!val) return;
    state.names.push(val);
    saveWongLaoState(state);
    renderPickerGame(body, state);
  });
  body.querySelector("#nameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") body.querySelector("#addNameBtn").click();
  });

  const pickBtn = body.querySelector("#pickBtn");
  pickBtn.addEventListener("click", () => {
    const idx = Math.floor(Math.random() * state.names.length);
    state.pickedName = state.names[idx];
    saveWongLaoState(state);
    body.querySelector("#pickerResult").textContent = `🍻 ${state.pickedName} โดน!`;
  });
}
