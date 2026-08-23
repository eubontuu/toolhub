// ToolHub — app shell + registry
// เพิ่มเครื่องมือใหม่ในอนาคต: push object ลงใน APPS แล้วเขียนฟังก์ชัน render ของมัน

const APPS = [
  {
    id: "counter",
    name: "บวก/ลบ",
    icon: "±",
    render: renderCounter,
  },
  {
    id: "wonglao",
    name: "วงเหล้า",
    icon: "🍻",
    render: renderWongLao,
  },
  {
    id: "hikeprep",
    name: "เตรียมเดินป่า",
    icon: "🥾",
    render: renderHikePrep,
  },
];

const root = document.getElementById("app");

function navigate(route) {
  location.hash = route;
}

function currentRoute() {
  return location.hash.replace(/^#/, "") || "home";
}

function render() {
  const route = currentRoute();
  if (route === "home") {
    renderHome();
    return;
  }
  const [, appId] = route.split("/");
  const app = APPS.find((a) => a.id === appId);
  if (!app) {
    renderHome();
    return;
  }
  renderToolShell(app);
}

function renderHome() {
  root.innerHTML = `
    <div class="home">
      <h1>ToolHub</h1>
      <p class="sub">รวมเครื่องมือของคุณไว้ที่เดียว</p>
      <div class="grid" id="grid"></div>
      ${APPS.length === 0 ? '<div class="empty-hint">ยังไม่มีเครื่องมือ — จะเพิ่มเข้ามาเรื่อยๆ</div>' : ""}
    </div>
  `;
  const grid = document.getElementById("grid");
  APPS.forEach((app) => {
    const btn = document.createElement("button");
    btn.className = "icon-btn";
    btn.innerHTML = `<div class="icon-tile">${app.icon}</div><div class="icon-label">${app.name}</div>`;
    btn.addEventListener("click", () => navigate(`app/${app.id}`));
    grid.appendChild(btn);
  });
}

function renderToolShell(app) {
  root.innerHTML = `
    <div class="tool-screen">
      <div class="tool-header">
        <button class="back-btn" id="back">‹</button>
        <div class="tool-title">${app.name}</div>
      </div>
      <div class="tool-body" id="tool-body"></div>
    </div>
  `;
  document.getElementById("back").addEventListener("click", () => navigate("home"));
  app.render(document.getElementById("tool-body"));
}

// ---------- Counter tool ----------

const STEP_OPTIONS = [5, 10, 15, 20];

function loadCounterState() {
  try {
    const raw = localStorage.getItem("toolhub.counter");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { value: 0, step: 5 };
}

function saveCounterState(state) {
  localStorage.setItem("toolhub.counter", JSON.stringify(state));
}

function renderCounter(container) {
  const state = loadCounterState();

  container.innerHTML = `
    <div class="counter">
      <div class="counter-display-wrap">
        <div class="counter-display" id="display">${state.value}</div>
      </div>
      <div class="step-row">
        <div class="step-label">เลือกจำนวนที่จะบวก/ลบ</div>
        ${STEP_OPTIONS.map(
          (n) => `<button class="step-chip" data-step="${n}">${n}</button>`
        ).join("")}
        <button class="step-chip" id="customStep">กำหนดเอง</button>
      </div>
      <div class="buttons-row">
        <button class="big-btn minus" id="minus">−</button>
        <button class="big-btn plus" id="plus">+</button>
      </div>
      <button class="reset-btn" id="reset">รีเซ็ตเป็น 0</button>
    </div>
  `;

  const display = container.querySelector("#display");
  const chips = container.querySelectorAll(".step-chip[data-step]");
  const customBtn = container.querySelector("#customStep");

  function updateChipHighlight() {
    let matched = false;
    chips.forEach((chip) => {
      const isActive = Number(chip.dataset.step) === state.step;
      chip.classList.toggle("active", isActive);
      if (isActive) matched = true;
    });
    customBtn.classList.toggle("active", !matched);
    customBtn.textContent = matched ? "กำหนดเอง" : `กำหนดเอง (${state.step})`;
  }

  function updateDisplay() {
    display.textContent = state.value;
    display.classList.toggle("negative", state.value < 0);
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      state.step = Number(chip.dataset.step);
      saveCounterState(state);
      updateChipHighlight();
    });
  });

  customBtn.addEventListener("click", () => {
    const input = prompt("กำหนดจำนวนที่จะบวก/ลบ", state.step);
    if (input === null) return;
    const n = Number(input);
    if (!Number.isFinite(n) || n <= 0) return;
    state.step = n;
    saveCounterState(state);
    updateChipHighlight();
  });

  container.querySelector("#plus").addEventListener("click", () => {
    state.value += state.step;
    saveCounterState(state);
    updateDisplay();
  });

  container.querySelector("#minus").addEventListener("click", () => {
    state.value -= state.step;
    saveCounterState(state);
    updateDisplay();
  });

  container.querySelector("#reset").addEventListener("click", () => {
    state.value = 0;
    saveCounterState(state);
    updateDisplay();
  });

  updateChipHighlight();
  updateDisplay();
}

// ---------- วงเหล้า tool (random picker / ไพ่ Ohana / ไพ่สุ่ม) ----------

const WONGLAO_TABS = [
  { id: "picker", label: "สุ่มคน", icon: "🎯" },
  { id: "ohana", label: "ไพ่ Ohana", icon: "🃏" },
  { id: "randomcard", label: "ไพ่สุ่ม", icon: "🎴" },
  { id: "wheel", label: "วงล้อ", icon: "🎡" },
  { id: "chwazi", label: "Chwazi", icon: "🖐️" },
  { id: "quiz", label: "Flash Quiz", icon: "⚡" },
];

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
    btn.innerHTML = `<div class="icon-tile">${t.icon}</div><div class="icon-label">${t.label}</div>`;
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
        <div class="wl-game-title">${meta.icon} ${meta.label}</div>
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

// ---------- ไพ่ Ohana ----------

const OHANA_SUITS = ["♠", "♥", "♦", "♣"];
const OHANA_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const OHANA_RULES = {
  A: "ดื่มคนเดียว",
  2: "ดื่มเอง แล้วหาอีก 1 คนดื่มด้วย",
  3: "ดื่มเอง แล้วหาอีก 2 คนดื่มด้วย",
  4: "คนทางซ้ายของคนจั่วดื่ม",
  5: "ทุกคนดื่ม",
  6: "คนทางขวาของคนจั่วดื่ม",
  7: "เล่นมินิเกมกัน",
  8: "พัก 1 ยก",
  9: "เล่นมินิเกม (เหมือน 7)",
  10: "ทาแป้ง",
  J: "จับหน้า",
  Q: "แหม่ม ห้ามใครคุยด้วย",
  K: "สร้างกฎ ทำตามที่ตกลงกัน",
};

function buildOhanaDeck() {
  const deck = [];
  for (const suit of OHANA_SUITS) {
    for (const rank of OHANA_RANKS) {
      deck.push(rank + suit);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function renderOhanaGame(body, state) {
  if (!state.ohanaDeck || !state.ohanaDeck.length) {
    if (!state.ohanaDeck) {
      state.ohanaDeck = buildOhanaDeck();
      saveWongLaoState(state);
    }
  }

  function draw() {
    const last = state.ohanaLast;
    const rank = last ? last.slice(0, -1) : null;
    const suit = last ? last.slice(-1) : null;
    const isRed = suit === "♥" || suit === "♦";
    const deckEmpty = state.ohanaDeck.length === 0;

    body.innerHTML = `
      <div class="ohana-wrap">
        <div class="ohana-count">เหลือ ${state.ohanaDeck.length} ใบ</div>
        <div class="ohana-card ${last ? (isRed ? "red" : "") : "empty"}">
          ${last ? `<span class="ohana-rank">${rank}</span><span class="ohana-suit">${suit}</span>` : "🃏"}
        </div>
        <div class="ohana-rule" id="ohanaRule">${last ? OHANA_RULES[rank] : "กดจั่วไพ่เพื่อเริ่ม"}</div>
        <button class="wl-action-btn" id="drawCardBtn" ${deckEmpty ? "disabled" : ""}>จั่วไพ่</button>
        <button class="reset-btn" id="reshuffleBtn">${deckEmpty ? "สับไพ่ใหม่ (ครบ 52 ใบ)" : "สับไพ่ใหม่"}</button>
      </div>
    `;

    body.querySelector("#drawCardBtn").addEventListener("click", () => {
      state.ohanaLast = state.ohanaDeck.pop();
      saveWongLaoState(state);
      draw();
      const newRank = state.ohanaLast.slice(0, -1);
      const newSuit = state.ohanaLast.slice(-1);
      const newIsRed = newSuit === "♥" || newSuit === "♦";
      showOhanaOverlay(newRank, newSuit, newIsRed, OHANA_RULES[newRank]);
    });

    body.querySelector("#reshuffleBtn").addEventListener("click", () => {
      state.ohanaDeck = buildOhanaDeck();
      state.ohanaLast = null;
      saveWongLaoState(state);
      draw();
    });
  }

  draw();
}

function showOhanaOverlay(rank, suit, isRed, ruleText) {
  const overlay = document.createElement("div");
  overlay.className = "ohana-overlay";
  overlay.innerHTML = `
    <div class="ohana-overlay-card ${isRed ? "red" : ""}">
      <span class="ohana-rank">${rank}</span>
      <span class="ohana-suit">${suit}</span>
    </div>
    <div class="ohana-overlay-rule">${ruleText}</div>
    <div class="ohana-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}

// ---------- ไพ่สุ่ม ----------

const RC_CORE_PROMPTS = [
  "ดื่มทั้งวง",
  "พัก 1 รอบ ห้ามดื่ม",
  "ผู้ชายในวงดื่มพร้อมกัน",
  "ผู้หญิงในวงดื่มพร้อมกัน",
  "คนตัวเตี้ยที่สุดในวงโดน",
  "คนตัวสูงที่สุดในวงโดน",
  "ห้ามพูดคำหยาบ 1 รอบ ใครหลุดโดนดื่ม",
  "ทุกคนยืนขึ้น 1 รอบ ใครนั่งก่อนโดนดื่ม",
  "ปิดตาข้างเดียวไว้ 1 รอบ ใครลืมโดนดื่ม",
  "บอกวันเกิดของคนข้างๆ ตอบไม่ได้โดนดื่ม",
  "เลือกคนดื่ม 1 คนตามใจชอบ",
  "คนที่เกิดวันที่เป็นเลขคี่โดน",
  "คนที่เกิดวันที่เป็นเลขคู่โดน",
  "คนทางซ้ายมือดื่ม",
  "คนทางขวามือดื่ม",
  "คนที่จั่วไพ่ใบนี้ดื่มเอง",
  "ทุกคนชนแก้วแล้วดื่มพร้อมกัน",
  "ห้ามยิ้ม 1 รอบ ใครยิ้มก่อนโดนดื่ม",
  "ห้ามใช้มือซ้ายหยิบจับอะไรเลย 1 รอบ ใครทำผิดโดนดื่ม",
  "คนที่มาถึงวงนี้ล่าสุดโดน",
  "คนที่ใส่รองเท้าผ้าใบวันนี้โดน",
  "คนโสดในวงโดน",
  "คนมีแฟนในวงโดน",
  "นับ 3 2 1 ทุกคนชี้นิ้วไปที่คนที่คิดว่าจะโดน คนที่ถูกชี้เยอะสุดดื่ม",
  "ร้องเพลงฮิตท่อนฮุก ใครร้องไม่ได้โดนดื่ม",
  "ทายใจคนทางขวามือ 1 ข้อ ทายผิดโดนดื่ม",
  "จับคู่กับคนข้างๆ ดื่มพร้อมกัน",
  "ดื่มวนรอบวงทวนเข็มนาฬิกา 1 รอบ",
  "เช็คแบตมือถือ คนแบตต่ำสุดโดน",
  "เจ้าของวงชี้ใครก็ได้ 1 คนดื่มฟรีไม่ต้องมีเหตุผล",
  "ดวลเป่ายิงฉุบ ผู้แพ้ดื่ม 2 ที",
  "หมุนขวดกลางวง ปลายขวดชี้ใครคนนั้นโดน",
  "คนที่กำลังถือโทรศัพท์อยู่ตอนนี้โดน",
  "คนที่ใส่แว่นตาโดน",
  "คนที่ไม่ได้ใส่แว่นตาโดน",
  "คนที่ใส่นาฬิกาข้อมือโดน",
  "คนที่ผมยาวกว่าคนข้างๆโดน",
  "คนที่ขับรถยนต์มาวันนี้โดน",
  "คนที่ขับมอเตอร์ไซค์มาวันนี้โดน",
  "ทุกคนยกแก้วชนกันก่อนดื่มรอบนี้",
  "คนที่ดื่มช้าสุดในรอบที่แล้วดื่มเพิ่ม 1 ที",
  "คนที่หมดแก้วก่อนใครในรอบที่แล้วเลือกคนดื่มรอบนี้",
  "จับคู่ 2 คน ดื่มพร้อมกันตอนนี้เลย",
  "คนถัดไปตามเข็มนาฬิกาดื่ม",
  "คนถัดไปทวนเข็มนาฬิกาดื่ม",
];

const RC_CHALLENGE_PROMPTS = [
  "ห้ามไขว่ห้าง 1 รอบ ใครทำผิดโดนดื่ม",
  "ห้ามเรียกชื่อตัวเอง 1 รอบ ใครทำผิดโดนดื่ม",
  'ต้องพูด "ครับ/ค่ะ" ท้ายทุกประโยค 1 รอบ ใครลืมโดนดื่ม',
  "ห้ามหันหน้าไปทางซ้าย 1 รอบ ใครทำผิดโดนดื่ม",
  'ห้ามเรียกชื่อเพื่อนตรงๆ ต้องเรียก "นาย" หรือ "เธอ" แทน 1 รอบ ใครทำผิดโดนดื่ม',
  "ห้ามแตะโทรศัพท์ 1 รอบ ใครทำผิดโดนดื่ม",
  "ห้ามวางแขนบนโต๊ะ 1 รอบ ใครทำผิดโดนดื่ม",
  "ทุกครั้งที่มีคนพูด ต้องชี้นิ้วไปที่คนนั้น 1 รอบ ใครลืมโดนดื่ม",
  'ห้ามพูดคำว่า "ใช่" หรือ "ไม่ใช่" 1 รอบ ใครทำผิดโดนดื่ม',
  'ห้ามพูดคำว่า "เมา" 1 รอบ ใครหลุดโดนดื่ม',
  "ห้ามกระพริบตาตอนถูกจ้อง 5 วินาที ใครกระพริบก่อนโดนดื่ม",
  "ห้ามพูดชื่อสัตว์เลี้ยงตัวเอง 1 รอบ ใครทำผิดโดนดื่ม",
  "ห้ามพูดภาษาไทย 1 รอบ ใครหลุดไทยโดนดื่ม",
  "ห้ามชี้นิ้วใส่ใคร 1 รอบ ใครทำผิดโดนดื่ม",
  'ห้ามพูดคำว่า "ไม่" 1 รอบ ใครทำผิดโดนดื่ม',
];

const RC_SUPERLATIVE_PROMPTS = [
  "คนที่อายุมากที่สุดในวงโดน",
  "คนที่อายุน้อยที่สุดในวงโดน",
  "คนที่มือใหญ่ที่สุดในวงโดน",
  "คนที่เท้าใหญ่ที่สุดในวงโดน",
  "คนที่ผมยาวที่สุดในวงโดน",
  "คนที่ผมสั้นที่สุดในวงโดน",
  "คนที่นาฬิกาแพงที่สุดเท่าที่รู้โดน",
  "คนที่แบตโทรศัพท์เหลือน้อยที่สุดโดน",
  "คนที่มีเงินสดในกระเป๋าน้อยที่สุดโดน",
  "คนที่มีเงินสดในกระเป๋ามากที่สุดโดน",
  "คนที่มาถึงงานคนแรกโดน",
  "คนที่มาถึงงานคนสุดท้ายโดน",
  "คนที่นั่งตรงข้ามเจ้าของวงโดน",
  "คนถัดจากคนที่เพิ่งดื่มไปโดนต่อ",
  "คนที่หัวเราะดังที่สุดตอนนี้โดน",
  "คนที่เงียบที่สุดในวงตอนนี้โดน",
  "คนที่พูดเยอะที่สุดในวงตอนนี้โดน",
  "คนที่เพิ่งหัวเราะล่าสุดโดน",
  "คนที่ถือแก้วอยู่ตอนนี้โดน",
  "คนที่นั่งใกล้ประตูที่สุดโดน",
];

const RC_TIMED_PROMPTS = [
  "ทำหน้าตลกค้างไว้ 5 วินาที ใครหลุดหัวเราะก่อนโดน",
  "จ้องตาคนขวามือ 10 วินาทีห้ามกระพริบ ใครแพ้โดน",
  "ยืนขาเดียว 10 วินาที ใครวางเท้าก่อนโดน",
  "ปรบมือตามจังหวะที่เจ้าของวงตบ 10 วินาที ใครหลุดจังหวะโดน",
  "พูดตัวอักษร ก-ฮ ให้เร็วที่สุดโดยไม่ติด ใครติดโดน",
  "เขย่งเท้ายืน 10 วินาที ใครเซโดน",
  "ยิ้มแบบไม่ให้เห็นฟัน 10 วินาที ใครทำไม่ได้โดน",
  "ทำหน้านิ่งให้เพื่อนแหย่ 10 วินาที ใครหลุดโดน",
  "กอดอกห้ามขยับ 10 วินาที ใครขยับก่อนโดน",
  "พูดชื่อตัวเองกลับหลัง ใครพูดไม่ได้ใน 10 วินาทีโดน",
];

const RC_QUESTION_PROMPTS = [
  "เล่าเรื่องที่อายที่สุดที่เคยทำ ไม่เล่าโดนดื่ม",
  "บอกว่าถ้าได้เงินล้านวันนี้จะทำอะไรก่อน ไม่ตอบโดนดื่ม",
  "บอกสิ่งที่กลัวที่สุดในโลก ไม่ตอบโดนดื่ม",
  "บอกเพลงที่ฟังวนตอนอกหัก ไม่ตอบโดนดื่ม",
  "บอกว่าถ้าย้อนเวลาได้จะกลับไปแก้เรื่องอะไร ไม่ตอบโดนดื่ม",
  "ทายว่าใครในวงนี้จะรวยที่สุดในอนาคต ไม่ตอบโดนดื่ม",
  "ถ้าต้องติดเกาะร้างกับคนในวงนี้ 1 คนจะเลือกใคร ไม่ตอบโดนดื่ม",
  "เล่ามุกตลกที่ชอบที่สุด ไม่เล่าโดนดื่ม",
  "บอกครั้งล่าสุดที่แอบชอบใครคือเมื่อไหร่ ไม่ตอบโดนดื่ม",
  "บอกข้อดี 1 ข้อของคนขวามือ นึกไม่ออกโดนดื่ม",
];

const RC_DARE_PROMPTS = [
  "เต้นตามเพลงที่วงเลือกให้ 15 วินาที",
  "เลียนแบบท่าทางคนข้างๆ 10 วินาที",
  "พูดภาษาอังกฤษล้วน 1 รอบ ใครหลุดไทยโดนดื่ม",
  "ทำเสียงสัตว์ตามที่วงเลือกให้ 1 ครั้ง",
  "ไหว้ทุกคนในวงทีละคนพร้อมชม 1 ประโยค",
  "นั่งสลับที่กับคนขวามือ 1 รอบ",
  "ทำท่าตลกตามที่เพื่อนสั่ง 1 ท่า",
  "ร้องเพลงชาติท่อนแรก",
  "เล่นมุกตลก 1 มุกให้ทั้งวงฟัง",
  "ให้เพื่อนวาดรูปหน้าตัวเองแบบไม่มองกระดาษ",
  "โพสต์อิโมจิสุ่มลงกลุ่มแชทตามที่วงบอก",
  "ทำสีหน้าตามอารมณ์ที่วงสั่ง (ดีใจ/เศร้า/โกรธ)",
  "พูดชื่อเล่นตัวเองเป็นสำเนียงที่วงเลือกให้",
  "ให้คนขวามือจับมือทำนายดวง 10 วินาที",
  "ยืนพูดแนะนำตัวใหม่เหมือนเพิ่งเจอกันวันแรก",
];

const RC_MINIGAME_PROMPTS = [
  "มินิเกม: ผลัดกันบอกชื่ออาหารห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อจังหวัดในไทยห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อประเทศห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อสัตว์ห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อดาราหรือนักร้องห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อผลไม้ห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ต่อคำคล้องจอง ใครต่อไม่ได้โดน",
  "มินิเกม: นับเลข 1 ถึง 30 ห้ามพูดเลขที่หาร 3 ลงตัวให้ปรบมือแทน ใครพลาดโดน",
  "มินิเกม: เป่ายิงฉุบแพ้ติดกัน 2 ครั้งโดน",
  "มินิเกม: ทายคำจากใบ้ท่าทาง ใครทายไม่ออกภายใน 10 วินาทีโดน",
];

const RC_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const RC_COLORS = ["แดง","ส้ม","เหลือง","เขียว","ฟ้า","น้ำเงิน","ม่วง","ชมพู","ดำ","ขาว"];
const RC_THAI_ZODIAC = ["ชวด (หนู)","ฉลู (วัว)","ขาล (เสือ)","เถาะ (กระต่าย)","มะโรง (งูใหญ่)","มะเส็ง (งูเล็ก)","มะเมีย (ม้า)","มะแม (แพะ)","วอก (ลิง)","ระกา (ไก่)","จอ (หมา)","กุน (หมู)"];
const RC_WESTERN_ZODIAC = ["ราศีเมษ","ราศีพฤษภ","ราศีเมถุน","ราศีกรกฎ","ราศีสิงห์","ราศีกันย์","ราศีตุลย์","ราศีพิจิก","ราศีธนู","ราศีมังกร","ราศีกุมภ์","ราศีมีน"];
const RC_BLOOD_TYPES = ["A", "B", "AB", "O"];

function buildRcTemplatedPrompts() {
  const list = [];
  RC_MONTHS.forEach((m) => list.push(`คนที่เกิดเดือน${m}โดน`));
  RC_COLORS.forEach((c) => list.push(`คนที่ใส่เสื้อสี${c}โดน`));
  RC_THAI_ZODIAC.forEach((a) => list.push(`คนเกิดปีนักษัตร${a}โดน`));
  RC_WESTERN_ZODIAC.forEach((z) => list.push(`คน${z}โดน`));
  RC_BLOOD_TYPES.forEach((b) => list.push(`คนหมู่เลือด ${b} โดน`));
  for (let n = 1; n <= 10; n++) list.push(`คนที่นั่งลำดับที่ ${n} นับจากซ้ายมือโดน`);
  return list;
}

function buildRcBuiltInPool() {
  return [
    ...RC_CORE_PROMPTS,
    ...RC_CHALLENGE_PROMPTS,
    ...RC_SUPERLATIVE_PROMPTS,
    ...RC_TIMED_PROMPTS,
    ...RC_QUESTION_PROMPTS,
    ...RC_DARE_PROMPTS,
    ...RC_MINIGAME_PROMPTS,
    ...buildRcTemplatedPrompts(),
  ];
}

const RC_BUILTIN_POOL = buildRcBuiltInPool();
const RC_QUANTITY_OPTIONS = [20, 50, 100, "all"];

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRcDeck(quantity, custom, excluded) {
  const effectivePool = RC_BUILTIN_POOL.filter((item) => !excluded.includes(item));
  const shuffledPool = shuffleArray(effectivePool);
  const picked = quantity === "all" ? shuffledPool : shuffledPool.slice(0, Math.min(quantity, shuffledPool.length));
  return shuffleArray([...picked, ...custom]);
}

function rcRemoveFromPool(text, state) {
  const customIdx = state.rcCustom.indexOf(text);
  if (customIdx !== -1) {
    state.rcCustom.splice(customIdx, 1);
  } else if (!state.rcExcluded.includes(text)) {
    state.rcExcluded.push(text);
  }
  if (state.rcDeck) {
    state.rcDeck = state.rcDeck.filter((d) => d !== text);
  }
  saveWongLaoState(state);
}

function renderRandomCardGame(body, state) {
  if (state.rcStarted && state.rcDeck) {
    renderRcDrawScreen(body, state);
  } else {
    renderRcSetupScreen(body, state);
  }
}

function renderRcSetupScreen(body, state) {
  const builtInCount = RC_BUILTIN_POOL.length - state.rcExcluded.length;
  const totalCount = builtInCount + state.rcCustom.length;
  const listItems = [...RC_BUILTIN_POOL.filter((p) => !state.rcExcluded.includes(p)), ...state.rcCustom];

  body.innerHTML = `
    <div class="rc-setup">
      <div class="rc-total">มีบทลงโทษทั้งหมด ${totalCount} ใบ (${builtInCount} มาตรฐาน + ${state.rcCustom.length} ที่คุณเพิ่มเอง)</div>
      <button class="reset-btn" id="rcToggleList">${state.rcShowList ? "ซ่อนรายการ" : "ดูรายการทั้งหมด"}</button>
      ${
        state.rcExcluded.length > 0
          ? `<button class="reset-btn" id="rcRestoreBtn">กู้คืนรายการที่ลบ (${state.rcExcluded.length})</button>`
          : ""
      }
      ${
        state.rcShowList
          ? `<div class="rc-list">${listItems
              .map((p, i) => `<div class="rc-list-item"><span>${p}</span><button class="rc-list-del" data-i="${i}">×</button></div>`)
              .join("")}</div>`
          : ""
      }

      <div class="step-row">
        <div class="step-label">เลือกจำนวนใบในกอง</div>
        ${RC_QUANTITY_OPTIONS.map(
          (q) => `<button class="step-chip ${state.rcQuantity === q ? "active" : ""}" data-q="${q}">${q === "all" ? "ทั้งหมด" : q}</button>`
        ).join("")}
      </div>

      <div class="picker-input-row">
        <input type="text" id="rcCustomInput" placeholder="พิมพ์บทลงโทษของคุณเองแล้วกดเพิ่ม" />
        <button id="rcAddCustomBtn">เพิ่ม</button>
      </div>
      <div class="picker-list" id="rcCustomList"></div>

      <button class="wl-action-btn" id="rcStartBtn">เริ่มเปิดไพ่</button>
    </div>
  `;

  body.querySelector("#rcToggleList").addEventListener("click", () => {
    state.rcShowList = !state.rcShowList;
    saveWongLaoState(state);
    renderRcSetupScreen(body, state);
  });

  const restoreBtn = body.querySelector("#rcRestoreBtn");
  if (restoreBtn) {
    restoreBtn.addEventListener("click", () => {
      state.rcExcluded = [];
      saveWongLaoState(state);
      renderRcSetupScreen(body, state);
    });
  }

  body.querySelectorAll(".rc-list-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      rcRemoveFromPool(listItems[Number(btn.dataset.i)], state);
      renderRcSetupScreen(body, state);
    });
  });

  body.querySelectorAll(".step-chip[data-q]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.dataset.q === "all" ? "all" : Number(chip.dataset.q);
      state.rcQuantity = q;
      saveWongLaoState(state);
      renderRcSetupScreen(body, state);
    });
  });

  const customList = body.querySelector("#rcCustomList");
  state.rcCustom.forEach((text, i) => {
    const chip = document.createElement("div");
    chip.className = "name-chip";
    chip.innerHTML = `<span>${text}</span><button data-i="${i}">×</button>`;
    customList.appendChild(chip);
  });
  customList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.rcCustom.splice(Number(btn.dataset.i), 1);
      saveWongLaoState(state);
      renderRcSetupScreen(body, state);
    });
  });

  body.querySelector("#rcAddCustomBtn").addEventListener("click", () => {
    const input = body.querySelector("#rcCustomInput");
    const val = input.value.trim();
    if (!val) return;
    state.rcCustom.push(val);
    saveWongLaoState(state);
    renderRcSetupScreen(body, state);
  });
  body.querySelector("#rcCustomInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") body.querySelector("#rcAddCustomBtn").click();
  });

  body.querySelector("#rcStartBtn").addEventListener("click", () => {
    state.rcDeck = buildRcDeck(state.rcQuantity, state.rcCustom, state.rcExcluded);
    state.rcLast = null;
    state.rcStarted = true;
    saveWongLaoState(state);
    renderRcDrawScreen(body, state);
  });
}

function renderRcDrawScreen(body, state) {
  const deckEmpty = state.rcDeck.length === 0;

  body.innerHTML = `
    <div class="rc-draw">
      <div class="rc-count">เหลือ ${state.rcDeck.length} ใบ</div>
      <div class="rc-card ${state.rcLast ? "" : "empty"}">
        <span class="rc-card-text">${state.rcLast || "🎴"}</span>
      </div>
      <button class="wl-action-btn" id="rcDrawBtn" ${deckEmpty ? "disabled" : ""}>เปิดไพ่</button>
      <div class="rc-draw-actions">
        <button class="reset-btn" id="rcReshuffleBtn">สับไพ่ใหม่</button>
        <button class="reset-btn" id="rcDeleteBtn" ${state.rcLast ? "" : "disabled"}>ลบใบนี้ทิ้ง</button>
        <button class="reset-btn" id="rcSettingsBtn">ตั้งค่า</button>
      </div>
    </div>
  `;

  body.querySelector("#rcDrawBtn").addEventListener("click", () => {
    state.rcLast = state.rcDeck.pop();
    saveWongLaoState(state);
    renderRcDrawScreen(body, state);
    showRcOverlay(state.rcLast);
  });

  body.querySelector("#rcReshuffleBtn").addEventListener("click", () => {
    state.rcDeck = buildRcDeck(state.rcQuantity, state.rcCustom, state.rcExcluded);
    state.rcLast = null;
    saveWongLaoState(state);
    renderRcDrawScreen(body, state);
  });

  body.querySelector("#rcDeleteBtn").addEventListener("click", () => {
    if (!state.rcLast) return;
    rcRemoveFromPool(state.rcLast, state);
    state.rcLast = null;
    saveWongLaoState(state);
    renderRcDrawScreen(body, state);
  });

  body.querySelector("#rcSettingsBtn").addEventListener("click", () => {
    state.rcStarted = false;
    saveWongLaoState(state);
    renderRcSetupScreen(body, state);
  });
}

function showRcOverlay(text) {
  const overlay = document.createElement("div");
  overlay.className = "rc-overlay";
  overlay.innerHTML = `
    <div class="rc-overlay-card"><span>${text}</span></div>
    <div class="rc-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}

// ---------- วงล้อ ----------

const WHEEL_MAX_OPTIONS = [6, 10, 20, 52];

function renderWheelGame(body, state) {
  function draw() {
    body.innerHTML = `
      <div class="wheel-wrap">
        <div class="wheel-display ${state.wheelLast === null ? "empty" : ""}" id="wheelDisplay">${
          state.wheelLast === null ? "?" : state.wheelLast
        }</div>
        <div class="step-row">
          <div class="step-label">เลือกเลขสูงสุด (สุ่มตั้งแต่ 1 ถึงเลขนี้)</div>
          ${WHEEL_MAX_OPTIONS.map(
            (n) => `<button class="step-chip ${state.wheelMax === n ? "active" : ""}" data-max="${n}">${n}</button>`
          ).join("")}
          <button class="step-chip" id="wheelCustomMax">กำหนดเอง</button>
        </div>
        <button class="wl-action-btn" id="spinBtn">หมุน</button>
      </div>
    `;

    body.querySelectorAll(".step-chip[data-max]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.wheelMax = Number(chip.dataset.max);
        saveWongLaoState(state);
        draw();
      });
    });

    body.querySelector("#wheelCustomMax").addEventListener("click", () => {
      const input = prompt("กำหนดเลขสูงสุด (สุ่มตั้งแต่ 1 ถึงเลขนี้)", state.wheelMax);
      if (input === null) return;
      const n = Number(input);
      if (!Number.isInteger(n) || n < 2) return;
      state.wheelMax = n;
      saveWongLaoState(state);
      draw();
    });

    body.querySelector("#spinBtn").addEventListener("click", () => {
      const display = body.querySelector("#wheelDisplay");
      display.classList.remove("empty");
      let ticks = 0;
      const spin = setInterval(() => {
        display.textContent = String(1 + Math.floor(Math.random() * state.wheelMax));
        ticks++;
        if (ticks > 12) {
          clearInterval(spin);
          const finalVal = 1 + Math.floor(Math.random() * state.wheelMax);
          display.textContent = finalVal;
          state.wheelLast = finalVal;
          saveWongLaoState(state);
          showWheelOverlay(finalVal);
        }
      }, 70);
    });
  }

  draw();
}

function showWheelOverlay(value) {
  const overlay = document.createElement("div");
  overlay.className = "wheel-overlay";
  overlay.innerHTML = `
    <div class="wheel-overlay-circle"><span>${value}</span></div>
    <div class="wheel-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}

// ---------- Chwazi (วางนิ้วพร้อมกัน สุ่มคนโดน) ----------

function renderChwaziGame(body, state) {
  body.innerHTML = `
    <div class="chwazi-wrap">
      <div class="chwazi-hint" id="chwaziHint">ให้ทุกคนวางนิ้วบนจอพร้อมกันแล้วอย่าเพิ่งยก</div>
      <div class="chwazi-area" id="chwaziArea"></div>
    </div>
  `;

  const area = body.querySelector("#chwaziArea");
  const hint = body.querySelector("#chwaziHint");
  const points = new Map();
  let countdownTimer = null;
  let winnerId = null;

  function setHint(text, hidden) {
    hint.textContent = text;
    hint.classList.toggle("hidden", !!hidden);
  }

  function resetIfEmpty() {
    if (points.size === 0) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
      winnerId = null;
      setHint("ให้ทุกคนวางนิ้วบนจอพร้อมกันแล้วอย่าเพิ่งยก", false);
    }
  }

  function pickWinner() {
    if (points.size === 0) return;
    const ids = [...points.keys()];
    winnerId = ids[Math.floor(Math.random() * ids.length)];
    points.forEach((p, id) => {
      p.el.classList.toggle("winner", id === winnerId);
      p.el.classList.toggle("loser", id !== winnerId);
    });
    setHint("โดนแล้ว! ยกนิ้วออกแล้ววางใหม่เพื่อเล่นรอบต่อไป", true);
  }

  function startCountdown() {
    clearTimeout(countdownTimer);
    if (winnerId) return;
    if (points.size < 2) {
      setHint(`รอเพื่อนอีก... (${points.size} นิ้ว)`, false);
      return;
    }
    setHint(`กำลังสุ่ม... (${points.size} นิ้ว)`, false);
    countdownTimer = setTimeout(pickWinner, 2000);
  }

  function addPoint(id, x, y) {
    const el = document.createElement("div");
    el.className = "chwazi-dot";
    el.style.left = x + "px";
    el.style.top = y + "px";
    area.appendChild(el);
    points.set(id, { el });
  }

  function movePoint(id, x, y) {
    const p = points.get(id);
    if (!p) return;
    p.el.style.left = x + "px";
    p.el.style.top = y + "px";
  }

  function removePoint(id) {
    const p = points.get(id);
    if (p) {
      p.el.remove();
      points.delete(id);
    }
    resetIfEmpty();
    if (points.size > 0 && !winnerId) startCountdown();
  }

  area.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    area.setPointerCapture(e.pointerId);
    if (winnerId) {
      points.forEach((p) => p.el.remove());
      points.clear();
      winnerId = null;
    }
    const rect = area.getBoundingClientRect();
    addPoint(e.pointerId, e.clientX - rect.left, e.clientY - rect.top);
    startCountdown();
  });

  area.addEventListener("pointermove", (e) => {
    if (!points.has(e.pointerId)) return;
    const rect = area.getBoundingClientRect();
    movePoint(e.pointerId, e.clientX - rect.left, e.clientY - rect.top);
  });

  area.addEventListener("pointerup", (e) => removePoint(e.pointerId));
  area.addEventListener("pointercancel", (e) => removePoint(e.pointerId));
}

// ---------- Flash Quiz ----------

const FLASH_QUIZ_QUESTIONS = [
  "1 บวก 1 เท่ากับเท่าไหร่?",
  "น้ำเดือดที่กี่องศาเซลเซียส?",
  "ประเทศไทยมีกี่ภาค?",
  "หนึ่งสัปดาห์มีกี่วัน?",
  "หนึ่งปีมีกี่เดือน?",
  "เมืองหลวงของประเทศไทยคือที่ไหน?",
  "ธงชาติไทยมีกี่สี?",
  "ดวงอาทิตย์ขึ้นทางทิศไหน?",
  "ดวงอาทิตย์ตกทางทิศไหน?",
  "แมวร้องว่าอย่างไร?",
  "สุนัขร้องว่าอย่างไร?",
  "น้ำแข็งทำมาจากอะไร?",
  "ใบไม้ส่วนใหญ่มีสีอะไร?",
  "หนึ่งชั่วโมงมีกี่นาที?",
  "หนึ่งนาทีมีกี่วินาที?",
  "ไทยใช้สกุลเงินอะไร?",
  "7 คูณ 8 เท่ากับเท่าไหร่?",
  "10 หาร 2 เท่ากับเท่าไหร่?",
  "ดาวเคราะห์ที่ใกล้ดวงอาทิตย์ที่สุดคือดวงไหน?",
  "ดาวเคราะห์ที่เราอาศัยอยู่ชื่อว่าอะไร?",
  "กบร้องว่าอย่างไร?",
  "ไก่ร้องตอนเช้าว่าอย่างไร?",
  "มนุษย์มีกี่นิ้วต่อมือ?",
  "ผลไม้ชนิดใดที่คนไทยเรียกว่า \"ราชาผลไม้\"?",
  "สัตว์ชนิดใดที่คอยาวที่สุด?",
  "สัตว์ชนิดใดที่ตัวใหญ่ที่สุดในโลก?",
  "ไข่ไก่ปกติมีสีอะไร?",
  "ท้องฟ้าเวลากลางวันปกติมีสีอะไร?",
  "น้ำทะเลมีรสชาติอย่างไร?",
  "มะนาวมีรสชาติอย่างไร?",
  "น้ำตาลมีรสชาติอย่างไร?",
  "เดือนที่มีวันน้อยที่สุดในหนึ่งปีคือเดือนอะไร?",
  "1 กิโลกรัมเท่ากับกี่กรัม?",
  "รุ้งกินน้ำมีกี่สี?",
  "ทวีปที่ประเทศไทยตั้งอยู่คือทวีปอะไร?",
  "เดือนแรกของปีคือเดือนอะไร?",
  "เดือนสุดท้ายของปีคือเดือนอะไร?",
];

function buildQuizDeck() {
  return shuffleArray(FLASH_QUIZ_QUESTIONS);
}

function renderFlashQuizGame(body, state) {
  if (!state.quizDeck) {
    state.quizDeck = buildQuizDeck();
    saveWongLaoState(state);
  }

  function draw() {
    const deckEmpty = state.quizDeck.length === 0;
    body.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-count">เหลือ ${state.quizDeck.length} ข้อ</div>
        <div class="quiz-card ${state.quizLast ? "" : "empty"}">
          <span class="quiz-card-text">${state.quizLast || "❓"}</span>
        </div>
        <button class="wl-action-btn" id="quizDrawBtn" ${deckEmpty ? "disabled" : ""}>เปิดคำถาม</button>
        <button class="reset-btn" id="quizReshuffleBtn">สับคำถามใหม่</button>
      </div>
    `;

    body.querySelector("#quizDrawBtn").addEventListener("click", () => {
      state.quizLast = state.quizDeck.pop();
      saveWongLaoState(state);
      draw();
    });

    body.querySelector("#quizReshuffleBtn").addEventListener("click", () => {
      state.quizDeck = buildQuizDeck();
      state.quizLast = null;
      saveWongLaoState(state);
      draw();
    });
  }

  draw();
}

// ---------- เตรียมเดินป่า ----------

const HIKE_TRIP_DATE = "2026-10-01";

const HIKE_DAYS = [
  { d: "2026-08-24", dow: "จันทร์", wk: 1, type: "strength", title: "Strength พื้นฐาน", detail: "สควอท 2x18, ลันจ์ 2x15/ขา, กลูทบริดจ์ 2x20, แพลงก์ 2x40วิ + ยืดเหยียด 10 นาที" },
  { d: "2026-08-25", dow: "อังคาร", wk: 1, type: "cardio", title: "Cardio เบาๆ", detail: "เดินเร็ว/จ็อกเบาๆ 30 นาที (คุยได้ระหว่างเดินแต่หอบเล็กน้อย)" },
  { d: "2026-08-26", dow: "พุธ", wk: 1, type: "cardio", title: "Leg Conditioning Circuit", detail: "จัมป์สควอท 2x15, วอล์กกิ้งลันจ์ 2x18/ขา, เขย่งปลายเท้า 2x30, high knees 2 รอบ x45วิ (พื้นราบ)" },
  { d: "2026-08-27", dow: "พฤหัสบดี", wk: 1, type: "rest", title: "พักฟื้นแบบ Active", detail: "ยืดเหยียด/โยคะเบาๆ 15-20 นาที" },
  { d: "2026-08-28", dow: "ศุกร์", wk: 1, type: "cardio", title: "Cardio เบาๆ", detail: "เดินเร็ว 30 นาที" },
  { d: "2026-08-29", dow: "เสาร์", wk: 1, type: "strength", title: "Strength รอบ 2", detail: "ทำซ้ำท่าเมื่อวันจันทร์ + เพิ่ม core: bicycle crunch 2x30, side plank 2x30วิ/ข้าง" },
  { d: "2026-08-30", dow: "อาทิตย์", wk: 1, type: "rest", title: "พักผ่อน", detail: "พักผ่อนเต็มที่ หรือเดินเบาๆ 20 นาที" },
  { d: "2026-08-31", dow: "จันทร์", wk: 2, type: "strength", title: "Strength เพิ่มความหนัก", detail: "สควอท 2x22, ลันจ์ 2x18/ขา, กลูทบริดจ์ 2x25, แพลงก์ 2x50วิ" },
  { d: "2026-09-01", dow: "อังคาร", wk: 2, type: "cardio", title: "Cardio", detail: "เดินเร็ว/จ็อกเบาๆ 40 นาที" },
  { d: "2026-09-02", dow: "พุธ", wk: 2, type: "cardio", title: "Leg Conditioning Circuit", detail: "จัมป์สควอท 2x18, วอล์กกิ้งลันจ์ 2x20/ขา, เขย่งปลายเท้า 2x35, high knees 2 รอบ x50วิ (พื้นราบ)" },
  { d: "2026-09-03", dow: "พฤหัสบดี", wk: 2, type: "rest", title: "พักฟื้นแบบ Active", detail: "ยืดเหยียด/โยคะเบาๆ 15-20 นาที" },
  { d: "2026-09-04", dow: "ศุกร์", wk: 2, type: "cardio", title: "Cardio", detail: "เดินเร็ว/จ็อกเบาๆ 40 นาที" },
  { d: "2026-09-05", dow: "เสาร์", wk: 2, type: "strength", title: "Strength รอบ 2", detail: "ทำซ้ำท่าเมื่อวันจันทร์ (สควอท 2x22, ลันจ์ 2x18/ขา, กลูทบริดจ์ 2x25, แพลงก์ 2x50วิ) + core: bicycle crunch 2x35, side plank 2x35วิ/ข้าง" },
  { d: "2026-09-06", dow: "อาทิตย์", wk: 2, type: "rest", title: "พักผ่อน", detail: "พักผ่อนเต็มที่ หรือเดินเบาๆ 20 นาที" },
  { d: "2026-09-07", dow: "จันทร์", wk: 3, type: "strength", title: "Strength ขั้นสูง", detail: "Split squat (มือจับเก้าอี้พยุงตัว) 2x15/ขา, จัมป์ลันจ์สลับขา 2x15/ขา, wall sit 2x45วิ, แพลงก์ 2x60วิ" },
  { d: "2026-09-08", dow: "อังคาร", wk: 3, type: "cardio", title: "Cardio", detail: "เดินเร็ว/ปั่นจักรยาน/ว่ายน้ำ 40-50 นาที (เลือกตามที่สะดวก)" },
  { d: "2026-09-09", dow: "พุธ", wk: 3, type: "ruck", title: "สะพายเป้พื้นราบ", detail: "เดินเร็วสะพายเป้ ใส่น้ำหนัก (ขวดน้ำ/หนังสือ) 3-5 กก. บนพื้นราบ 20-30 นาที สลับเร่งจังหวะ 2 นาที/พัก 1 นาที เพื่อชดเชยไม่มีทางลาดชัน" },
  { d: "2026-09-10", dow: "พฤหัสบดี", wk: 3, type: "rest", title: "พัก", detail: "พัก/ยืดเหยียด" },
  { d: "2026-09-11", dow: "ศุกร์", wk: 3, type: "cardio", title: "Cardio", detail: "40-50 นาที" },
  { d: "2026-09-12", dow: "เสาร์", wk: 3, type: "trail", title: "เดินไกลสะพายเป้ (พื้นราบ)", detail: "เดินเร็วสะพายเป้เบาๆ บนพื้นราบ 5-8 กม." },
  { d: "2026-09-13", dow: "อาทิตย์", wk: 3, type: "rest", title: "พักผ่อน", detail: "พักผ่อน + ยืดเหยียด" },
  { d: "2026-09-14", dow: "จันทร์", wk: 4, type: "strength", title: "Strength เพิ่มระดับ", detail: "Split squat 2x18/ขา, จัมป์ลันจ์สลับขา 2x18/ขา, wall sit 2x50วิ, แพลงก์ 2x65วิ" },
  { d: "2026-09-15", dow: "อังคาร", wk: 4, type: "cardio", title: "Cardio", detail: "40-50 นาที" },
  { d: "2026-09-16", dow: "พุธ", wk: 4, type: "ruck", title: "สะพายเป้พื้นราบ", detail: "เดินเร็วสะพายเป้ 5-7 กก. บนพื้นราบ 30-35 นาที สลับเร่งจังหวะ 2 นาที/พัก 1 นาที" },
  { d: "2026-09-17", dow: "พฤหัสบดี", wk: 4, type: "rest", title: "พัก", detail: "พัก/ยืดเหยียด" },
  { d: "2026-09-18", dow: "ศุกร์", wk: 4, type: "cardio", title: "Cardio", detail: "40-50 นาที" },
  { d: "2026-09-19", dow: "เสาร์", wk: 4, type: "trail", title: "เดินไกลสะพายเป้ (พื้นราบ)", detail: "เดินเร็วสะพายเป้ บนพื้นราบ 8-10 กม." },
  { d: "2026-09-20", dow: "อาทิตย์", wk: 4, type: "rest", title: "พักผ่อน", detail: "พักผ่อน + ยืดเหยียด" },
  { d: "2026-09-21", dow: "จันทร์", wk: 5, type: "strength", title: "Strength คงสภาพ", detail: "Split squat 2x15/ขา, จัมป์ลันจ์สลับขา 2x15/ขา, wall sit 2x45วิ, แพลงก์ 2x55วิ (ลดลงเล็กน้อยเก็บแรงไว้ก่อนวันจำลองสถานการณ์เสาร์นี้)" },
  { d: "2026-09-22", dow: "อังคาร", wk: 5, type: "cardio", title: "Cardio เบาๆ", detail: "เบาๆ 30 นาที" },
  { d: "2026-09-23", dow: "พุธ", wk: 5, type: "ruck", title: "สะพายเป้เต็มน้ำหนัก (พื้นราบ)", detail: "เดินเร็วสะพายเป้หนักใกล้เคียงทริปจริง บนพื้นราบ 30 นาที เร่งจังหวะเต็มที่ช่วง 10 นาทีสุดท้าย" },
  { d: "2026-09-24", dow: "พฤหัสบดี", wk: 5, type: "rest", title: "พัก", detail: "พักเต็มที่" },
  { d: "2026-09-25", dow: "ศุกร์", wk: 5, type: "cardio", title: "Cardio เบาๆ", detail: "เบาๆ 20-30 นาที" },
  { d: "2026-09-26", dow: "เสาร์", wk: 5, type: "trail", key: true, title: "จำลองสถานการณ์เต็มรูปแบบ", detail: "เดินไกลสะพายเป้หนักเท่าทริปจริง บนพื้นราบ 15-18 กม. (เพิ่มระยะชดเชยการไม่มีทางลาดชัน) — วันสำคัญที่สุดของโปรแกรม" },
  { d: "2026-09-27", dow: "อาทิตย์", wk: 5, type: "rest", title: "พักฟื้น", detail: "พักฟื้น + ยืดเหยียด" },
  { d: "2026-09-28", dow: "จันทร์", wk: 6, type: "taper", title: "Taper เบาๆ", detail: "ยืดเหยียดเบาๆ + strength เบามาก: split squat 2x10/ขา, wall sit 2x30วิ, แพลงก์ 2x40วิ" },
  { d: "2026-09-29", dow: "อังคาร", wk: 6, type: "taper", title: "เช็คอุปกรณ์", detail: "เดินเบาๆ 20 นาที + เช็ค/แพ็ครองเท้า เป้ อุปกรณ์ให้พร้อม" },
  { d: "2026-09-30", dow: "พุธ", wk: 6, type: "taper", title: "พักเต็มที่", detail: "พักเต็มที่ นอนให้พอ เตรียมของให้พร้อมก่อนออกเดินทาง" },
  { d: "2026-10-01", dow: "พฤหัสบดี", wk: 6, type: "trip", title: "วันเดินทาง", detail: "🎒 วันเดินทาง/เริ่มทริป — ขอให้สนุกและปลอดภัย!" },
];

const HIKE_TYPE_LABEL = { strength: "Strength", cardio: "Cardio", ruck: "สะพายเป้ (พื้นราบ)", trail: "เดินไกล (พื้นราบ)", rest: "พัก", taper: "Taper", trip: "ทริป" };
const HIKE_PHASE_BY_WEEK = {
  1: "สัปดาห์ 1-2 · สร้างพื้นฐาน",
  2: "สัปดาห์ 1-2 · สร้างพื้นฐาน",
  3: "สัปดาห์ 3-4 · เพิ่มความหนัก + สะพายเป้",
  4: "สัปดาห์ 3-4 · เพิ่มความหนัก + สะพายเป้",
  5: "สัปดาห์ 5 · จำลองสถานการณ์จริง",
  6: "สัปดาห์ 6 · ลดความหนัก (Taper)",
};
const HIKE_TIP_BY_TYPE = {
  strength: "ทำท่าให้ถูกฟอร์มดีกว่าทำเร็วแต่ท่าเพี้ยน",
  cardio: "รักษาจังหวะหายใจสม่ำเสมอ ไม่ต้องเร่งความเร็ว",
  ruck: "สะพายเป้ให้แนบลำตัว น้ำหนักอยู่ที่สะโพกไม่ใช่บ่า เร่งจังหวะเดินเพื่อชดเชยพื้นราบ",
  trail: "พกน้ำ ของว่าง และแจ้งเส้นทาง/เวลากลับให้คนที่บ้านทราบ",
  rest: "พักคือส่วนหนึ่งของการฝึก ร่างกายฟื้นตัวและแข็งแรงขึ้นตอนนี้",
  taper: "อย่าฝึกหนักช่วงนี้ เป้าหมายคือเก็บแรงไว้ให้เต็มที่",
  trip: "เดินจังหวะตัวเอง ดื่มน้ำสม่ำเสมอ ขอให้เที่ยวสนุก",
};

function hikeFmtThaiDate(dstr) {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const p = dstr.split("-");
  return `${parseInt(p[2], 10)} ${months[parseInt(p[1], 10) - 1]} ${parseInt(p[0], 10) + 543}`;
}

function hikeTodayStr() {
  const n = new Date();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${n.getFullYear()}-${m}-${d}`;
}

function hikeDaysBetween(a, b) {
  const A = new Date(`${a}T00:00:00`);
  const B = new Date(`${b}T00:00:00`);
  return Math.round((B - A) / 86400000);
}

function hikeGetDone(dstr) {
  try {
    return localStorage.getItem(`toolhub.hikeprep.${dstr}`) === "1";
  } catch (e) {
    return false;
  }
}

function hikeSetDone(dstr, val) {
  try {
    localStorage.setItem(`toolhub.hikeprep.${dstr}`, val ? "1" : "0");
  } catch (e) {}
}

function renderHikePrep(container) {
  container.innerHTML = `
    <div class="hike-wrap">
      <p class="hike-sub">แผน 6 สัปดาห์ ไม่ใช้อุปกรณ์ยิม ไม่มีบันได/เนิน · เริ่ม 24 ส.ค. — ทริป 1 ต.ค. 2026</p>

      <div class="hike-hero">
        <div class="hike-countdown">
          <div class="hike-countdown-num" id="hikeCountdownNum">—</div>
          <div class="hike-countdown-lbl" id="hikeCountdownLbl">วันก่อนทริป</div>
        </div>
        <div class="hike-hero-body">
          <span class="hike-hero-phase" id="hikeHeroPhase">กำลังโหลด…</span>
          <span class="hike-hero-date" id="hikeHeroDate"></span>
        </div>
      </div>

      <div class="hike-today-card" id="hikeTodayCard">
        <div class="hike-today-head">
          <span class="hike-today-label">วันนี้ต้องทำ</span>
          <span class="hike-badge" id="hikeTodayBadge"></span>
        </div>
        <div class="hike-today-title" id="hikeTodayTitle"></div>
        <div class="hike-today-detail" id="hikeTodayDetail"></div>
        <label class="hike-check-row" id="hikeTodayCheckRow" style="display:none">
          <input type="checkbox" id="hikeTodayCheck" />
          <span>ทำแล้ววันนี้</span>
        </label>
        <div class="hike-today-tip" id="hikeTodayTip"></div>
      </div>

      <div class="hike-progress-line">
        <span id="hikeProgressText">0/${HIKE_DAYS.length} วัน</span>
        <div class="hike-progress-track"><div class="hike-progress-fill" id="hikeProgressFill" style="width:0%"></div></div>
      </div>

      <div class="hike-plan-title">ตารางเต็ม 6 สัปดาห์</div>
      <div id="hikeWeeks"></div>

      <div class="hike-plan-title">Tips ก่อนและระหว่างทริป</div>
      <div class="hike-tip-grid">
        <div class="hike-tip-card"><span class="hike-tip-h">รองเท้า</span><p>ใส่รองเท้าเดินป่าคู่จริงซ้อมล่วงหน้าอย่างน้อย 2-3 สัปดาห์ ให้เท้าปรับตัวก่อนวันจริง</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">น้ำหนักเป้</span><p>ใช้เป้จริง + ขวดน้ำหรือหนังสือแทนดัมเบล เพิ่มน้ำหนักทีละน้อยไม่เกิน 10%/สัปดาห์</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">ป้องกันแผลพอง</span><p>แปะพลาสเตอร์จุดเสี่ยงก่อนเริ่มเดิน ไม่ต้องรอให้แผลเกิดก่อนค่อยแปะ</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">น้ำ &amp; เกลือแร่</span><p>จิบน้ำทีละน้อยบ่อยๆ ดีกว่ารอกระหายแล้วดื่มทีเดียวเยอะ พกเกลือแร่/ถั่วกันตะคริว</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">จังหวะการเดิน</span><p>เดินจังหวะสม่ำเสมอตามกำลังตัวเอง อย่าเร่งตามคนอื่นในช่วงแรกของเส้นทาง</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">การฟื้นฟู</span><p>นอนให้พอระหว่างซ้อม กล้ามเนื้อฟื้นตัวตอนนอนไม่ใช่ตอนออกกำลัง หากปวดข้อให้พัก อย่าฝืน</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">ไม่ได้ฝึกขึ้นเขามาก่อน</span><p>โปรแกรมนี้ฝึกบนพื้นราบทั้งหมด วันจริงตอนขึ้นเนิน/เขาอาจเหนื่อยกว่าที่ซ้อมมา ให้เดินช้าลงกว่าปกติช่วงขึ้นเขา พักบ่อยขึ้น และฟังจังหวะหัวใจตัวเองเป็นหลัก</p></div>
      </div>

      <div class="hike-footer">อัปเดตตนเองได้ทุกวัน · ข้อมูลเก็บไว้ในเครื่องนี้เท่านั้น</div>
    </div>
  `;

  function renderProgress() {
    let done = 0;
    HIKE_DAYS.forEach((d) => {
      if (hikeGetDone(d.d)) done++;
    });
    container.querySelector("#hikeProgressText").textContent = `${done}/${HIKE_DAYS.length} วัน`;
    container.querySelector("#hikeProgressFill").style.width = `${Math.round((done / HIKE_DAYS.length) * 100)}%`;
  }

  function renderWeeks() {
    const weeksEl = container.querySelector("#hikeWeeks");
    const today = hikeTodayStr();
    const byWeek = {};
    HIKE_DAYS.forEach((d) => {
      (byWeek[d.wk] = byWeek[d.wk] || []).push(d);
    });

    weeksEl.innerHTML = Object.keys(byWeek)
      .sort((a, b) => a - b)
      .map((wk) => {
        const containsToday = byWeek[wk].some((d) => d.d === today);
        const rows = byWeek[wk]
          .map((d) => {
            const done = hikeGetDone(d.d);
            return `
              <div class="hike-day-row ${done ? "done" : ""}">
                <span class="hike-day-check"><input type="checkbox" ${done ? "checked" : ""} data-date="${d.d}" /></span>
                <span class="hike-day-date">${d.d.slice(8, 10)}/${d.d.slice(5, 7)}<span class="hike-dow">${d.dow.slice(0, 3)}</span></span>
                <span class="hike-day-main"><div class="hike-day-title">${d.title}${d.key ? " ⭐" : ""}</div><div class="hike-day-text">${d.detail}</div></span>
                <span class="hike-badge ${d.type}">${HIKE_TYPE_LABEL[d.type]}</span>
              </div>
            `;
          })
          .join("");
        return `
          <details class="hike-week" ${containsToday ? "open" : ""}>
            <summary><span>สัปดาห์ ${wk}</span><span class="hike-week-phase">${HIKE_PHASE_BY_WEEK[wk]}</span><span class="hike-chev">›</span></summary>
            ${rows}
          </details>
        `;
      })
      .join("");

    weeksEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        hikeSetDone(cb.dataset.date, cb.checked);
        render();
      });
    });
  }

  function render() {
    const today = hikeTodayStr();
    const first = HIKE_DAYS[0].d;
    const cd = hikeDaysBetween(today, HIKE_TRIP_DATE);

    container.querySelector("#hikeCountdownNum").textContent = cd >= 0 ? cd : "ไป!";
    container.querySelector("#hikeCountdownLbl").textContent =
      cd > 0 ? "วันก่อนทริป" : cd === 0 ? "ออกเดินทางวันนี้" : "ระหว่างทริป/หลังทริป";
    container.querySelector("#hikeHeroDate").textContent = hikeFmtThaiDate(today);

    const entry = HIKE_DAYS.find((d) => d.d === today) || null;
    container.querySelector("#hikeHeroPhase").textContent = entry
      ? HIKE_PHASE_BY_WEEK[entry.wk]
      : today < first
      ? "ยังไม่เริ่มโปรแกรม"
      : "หลังทริป";

    const card = container.querySelector("#hikeTodayCard");
    const badge = container.querySelector("#hikeTodayBadge");
    const titleEl = container.querySelector("#hikeTodayTitle");
    const detailEl = container.querySelector("#hikeTodayDetail");
    const tipEl = container.querySelector("#hikeTodayTip");
    const checkRow = container.querySelector("#hikeTodayCheckRow");
    const checkbox = container.querySelector("#hikeTodayCheck");

    if (entry) {
      card.className = `hike-today-card ${entry.key ? "is-key" : ""}`;
      badge.className = `hike-badge ${entry.type}`;
      badge.textContent = HIKE_TYPE_LABEL[entry.type];
      titleEl.textContent = entry.title;
      detailEl.textContent = entry.detail;
      tipEl.textContent = `Tip: ${HIKE_TIP_BY_TYPE[entry.type]}`;
      checkRow.style.display = "flex";
      checkbox.checked = hikeGetDone(entry.d);
      checkbox.onchange = () => {
        hikeSetDone(entry.d, checkbox.checked);
        renderWeeks();
        renderProgress();
      };
    } else {
      badge.textContent = "";
      checkRow.style.display = "none";
      tipEl.textContent = "";
      if (today < first) {
        titleEl.textContent = "ยังไม่ถึงวันเริ่มโปรแกรม";
        detailEl.textContent = "โปรแกรมเริ่ม 24 ส.ค. 2026 — เตรียมรองเท้าและเป้ให้พร้อมระหว่างนี้";
      } else {
        titleEl.textContent = "ไปเดินป่าแล้ว! 🌲";
        detailEl.textContent = "ขอให้สนุกและปลอดภัยตลอดทริปนะ";
      }
    }

    renderWeeks();
    renderProgress();
  }

  render();
}

// ---------- Boot ----------

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
