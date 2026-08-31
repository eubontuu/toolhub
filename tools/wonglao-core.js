// วงเหล้า — shared state, menu/router, and shuffleArray util
// Must load before the other tools/wonglao-*.js files: they call saveWongLaoState/shuffleArray.

const WONGLAO_TABS = [
  { id: "ohana", label: "ไพ่ Ohana", icon: "🃏", iconImg: "icons/emoji/joker.svg" },
  { id: "randomcard", label: "ไพ่สุ่ม", icon: "🎴", iconImg: "icons/emoji/flower-card.svg" },
  { id: "wheel", label: "สุ่ม", icon: "🎡", iconImg: "icons/emoji/ferris-wheel.svg" },
  { id: "chwazi", label: "Chwazi", icon: "🖐️", iconImg: "icons/emoji/hand.svg" },
  { id: "quiz", label: "Flash Quiz", icon: "⚡", iconImg: "icons/emoji/zap.svg" },
  { id: "huay", label: "หวย", icon: "🎫" },
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
  wheelMode: "number",
  wheelMax: 6,
  wheelLast: null,
  diceCount: 2,
  diceLast: null,
  chwaziWinnerCount: 1,
  quizDeck: null,
  quizLast: null,
  huayDigits: 6,
  huayLast: null,
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

// แถบเลือกเกมเป็นบรรทัดเดียวเสมอ อยู่ด้านบนของทุกเกม (ไม่ใช่หน้าเมนูแยกอีกต่อไป) — กดแท็บสลับเกมได้ทันที
// พับ/กางแถบได้ (state ไม่ persist ข้ามการเปิดแอปใหม่ — แค่กันบังพื้นที่เล่นเกมชั่วคราว)
let wlTabbarHidden = false;

function renderWongLao(container) {
  const state = loadWongLaoState();
  if (!WONGLAO_TABS.some((t) => t.id === state.tab)) {
    state.tab = WONGLAO_TABS[0].id;
    saveWongLaoState(state);
  }

  function draw() {
    renderWongLaoShell(container, state, draw);
  }

  draw();
}

function renderWongLaoShell(container, state, draw) {
  container.innerHTML = `
    <div class="wl-shell">
      <div class="wl-tabbar-row ${wlTabbarHidden ? "hidden" : ""}" id="wlTabbarRow">
        <button class="wl-tab-nudge" id="wlNudgeLeft" aria-label="เลื่อนซ้าย">‹</button>
        <div class="wl-tabbar" id="wlTabbar">
          ${WONGLAO_TABS.map(
            (t) => `
          <button class="wl-tab ${t.id === state.tab ? "active" : ""}" data-tab-id="${t.id}">
            ${tabIconHtml(t, "wl-tab-icon")}<span>${t.label}</span>
          </button>`
          ).join("")}
        </div>
        <button class="wl-tab-nudge" id="wlNudgeRight" aria-label="เลื่อนขวา">›</button>
      </div>
      <button class="wl-tabbar-toggle" id="wlTabbarToggle">${wlTabbarHidden ? "▾ แถบเกม" : "▴ ซ่อนแถบ"}</button>
      <div class="wl-game-body" id="wlGameBody"></div>
    </div>
  `;

  container.querySelectorAll(".wl-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tabId === state.tab) return;
      state.tab = btn.dataset.tabId;
      saveWongLaoState(state);
      draw();
    });
  });

  const tabbar = container.querySelector("#wlTabbar");
  container.querySelector("#wlNudgeLeft").addEventListener("click", () => {
    tabbar.scrollBy({ left: -120, behavior: "smooth" });
  });
  container.querySelector("#wlNudgeRight").addEventListener("click", () => {
    tabbar.scrollBy({ left: 120, behavior: "smooth" });
  });

  container.querySelector("#wlTabbarToggle").addEventListener("click", () => {
    wlTabbarHidden = !wlTabbarHidden;
    draw();
  });

  const body = container.querySelector("#wlGameBody");
  if (state.tab === "ohana") renderOhanaGame(body, state);
  else if (state.tab === "randomcard") renderRandomCardGame(body, state);
  else if (state.tab === "wheel") renderWheelGame(body, state);
  else if (state.tab === "chwazi") renderChwaziGame(body, state);
  else if (state.tab === "quiz") renderFlashQuizGame(body, state);
  else renderHuayGame(body, state);
}
