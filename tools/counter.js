// บวก/ลบ tool — no dependency on other tool files

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
