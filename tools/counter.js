// บวก/ลบ tool — no dependency on other tool files

const STEP_OPTIONS = [5, 10, 15, 20];

function loadCounterState() {
  try {
    const raw = localStorage.getItem("toolhub.counter");
    if (raw) {
      const state = JSON.parse(raw);
      if (!Array.isArray(state.history)) state.history = [];
      if (typeof state.showHistory !== "boolean") state.showHistory = false;
      return state;
    }
  } catch (e) {}
  return { value: 0, step: 5, history: [], showHistory: false };
}

function formatHistoryTime(ts) {
  return new Date(ts).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "medium" });
}

function saveCounterState(state) {
  localStorage.setItem("toolhub.counter", JSON.stringify(state));
}

function renderCounter(container) {
  const state = loadCounterState();

  container.innerHTML = `
    <div class="counter">
      <div class="counter-history" id="historySection"></div>
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
    state.history.unshift({ delta: state.step, time: Date.now() });
    saveCounterState(state);
    updateDisplay();
    renderHistorySection();
  });

  container.querySelector("#minus").addEventListener("click", () => {
    state.value -= state.step;
    state.history.unshift({ delta: -state.step, time: Date.now() });
    saveCounterState(state);
    updateDisplay();
    renderHistorySection();
  });

  container.querySelector("#reset").addEventListener("click", () => {
    state.value = 0;
    saveCounterState(state);
    updateDisplay();
  });

  function renderHistorySection() {
    const box = container.querySelector("#historySection");
    const count = state.history.length;
    box.innerHTML = `
      <button class="counter-history-toggle" id="historyToggle" title="ประวัติ">
        🕘${count > 0 ? `<span class="counter-history-badge">${count}</span>` : ""}
      </button>
      ${
        state.showHistory
          ? `<div class="counter-history-panel">
              <div class="counter-history-panel-head">
                <span>ประวัติ</span>
                ${count > 0 ? `<button class="counter-history-clear" id="historyClearAll">ลบทั้งหมด</button>` : ""}
              </div>
              <div class="counter-history-list">
                ${
                  count === 0
                    ? `<div class="counter-history-empty">ยังไม่มีประวัติ</div>`
                    : state.history
                        .map(
                          (h, i) => `
                  <div class="counter-history-item">
                    <span class="counter-history-delta ${h.delta < 0 ? "negative" : ""}">${
                            h.delta > 0 ? "+" : ""
                          }${h.delta}</span>
                    <span class="counter-history-time">${formatHistoryTime(h.time)}</span>
                    <button class="counter-history-del" data-i="${i}">×</button>
                  </div>
                `
                        )
                        .join("")
                }
              </div>
            </div>`
          : ""
      }
    `;

    box.querySelector("#historyToggle").addEventListener("click", () => {
      state.showHistory = !state.showHistory;
      saveCounterState(state);
      renderHistorySection();
    });

    const clearAllBtn = box.querySelector("#historyClearAll");
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", () => {
        if (!confirm("ลบประวัติทั้งหมด?")) return;
        state.history = [];
        saveCounterState(state);
        renderHistorySection();
      });
    }

    box.querySelectorAll(".counter-history-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.history.splice(Number(btn.dataset.i), 1);
        saveCounterState(state);
        renderHistorySection();
      });
    });
  }

  updateChipHighlight();
  updateDisplay();
  renderHistorySection();
}
