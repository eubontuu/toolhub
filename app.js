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

// ---------- วงเหล้า tool (dice / random picker / rock-paper-scissors) ----------

const WONGLAO_TABS = [
  { id: "dice", label: "🎲 ลูกเต๋า" },
  { id: "picker", label: "🎯 สุ่มคน" },
  { id: "rps", label: "✊ เป่ายิ้งฉุบ" },
];

function loadWongLaoState() {
  try {
    const raw = localStorage.getItem("toolhub.wonglao");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { tab: "dice", diceValue: null, names: [], pickedName: null, rpsMessage: null };
}

function saveWongLaoState(state) {
  localStorage.setItem("toolhub.wonglao", JSON.stringify(state));
}

function renderWongLao(container) {
  const state = loadWongLaoState();

  function draw() {
    container.innerHTML = `
      <div class="wonglao">
        <div class="wl-tabs">
          ${WONGLAO_TABS.map(
            (t) => `<button class="wl-tab ${t.id === state.tab ? "active" : ""}" data-tab="${t.id}">${t.label}</button>`
          ).join("")}
        </div>
        <div class="wl-body" id="wlBody"></div>
      </div>
    `;
    container.querySelectorAll(".wl-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tab = btn.dataset.tab;
        saveWongLaoState(state);
        draw();
      });
    });
    const body = container.querySelector("#wlBody");
    if (state.tab === "dice") renderDiceGame(body, state);
    else if (state.tab === "picker") renderPickerGame(body, state);
    else renderRpsGame(body, state);
  }

  draw();
}

function renderDiceGame(body, state) {
  body.innerHTML = `
    <div class="dice-wrap">
      <div class="die" id="die">${state.diceValue || "?"}</div>
      <button class="wl-action-btn" id="rollBtn">ทอยลูกเต๋า</button>
    </div>
  `;
  body.querySelector("#rollBtn").addEventListener("click", () => {
    const die = body.querySelector("#die");
    let ticks = 0;
    const spin = setInterval(() => {
      die.textContent = String(1 + Math.floor(Math.random() * 6));
      ticks++;
      if (ticks > 8) {
        clearInterval(spin);
        const finalVal = 1 + Math.floor(Math.random() * 6);
        die.textContent = finalVal;
        state.diceValue = finalVal;
        saveWongLaoState(state);
      }
    }, 80);
  });
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

const RPS_CHOICES = [
  { id: "rock", label: "✊", name: "ค้อน" },
  { id: "paper", label: "✋", name: "กระดาษ" },
  { id: "scissors", label: "✌️", name: "กรรไกร" },
];

function rpsOutcome(player, cpu) {
  if (player === cpu) return "draw";
  const beats = { rock: "scissors", scissors: "paper", paper: "rock" };
  return beats[player] === cpu ? "win" : "lose";
}

function renderRpsGame(body, state) {
  body.innerHTML = `
    <div class="rps-wrap">
      <div class="rps-result" id="rpsResult">${state.rpsMessage || "เลือกไม้ของคุณ"}</div>
      <div class="rps-choices">
        ${RPS_CHOICES.map((c) => `<button class="rps-btn" data-id="${c.id}">${c.label}</button>`).join("")}
      </div>
    </div>
  `;

  body.querySelectorAll(".rps-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const playerChoice = RPS_CHOICES.find((c) => c.id === btn.dataset.id);
      const cpuChoice = RPS_CHOICES[Math.floor(Math.random() * RPS_CHOICES.length)];
      const outcome = rpsOutcome(playerChoice.id, cpuChoice.id);
      const outcomeText =
        outcome === "draw" ? "เสมอ ลองใหม่" : outcome === "win" ? "คุณชนะ! อีกฝั่งดื่ม 🍺" : "คุณแพ้! ดื่มเลย 🍺";
      state.rpsMessage = `${playerChoice.label} vs ${cpuChoice.label} — ${outcomeText}`;
      saveWongLaoState(state);
      body.querySelector("#rpsResult").textContent = state.rpsMessage;
    });
  });
}

// ---------- Boot ----------

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
