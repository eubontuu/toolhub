// ToolHub — app shell + registry
// เพิ่มเครื่องมือใหม่ในอนาคต: push object ลงใน APPS แล้วเขียนฟังก์ชัน render ของมัน

const APPS = [
  {
    id: "counter",
    name: "บวก/ลบ",
    icon: "±",
    render: renderCounter,
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

// ---------- Boot ----------

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
