// บวก/ลบ tool — no dependency on other tool files

const STEP_OPTIONS = [5, 10, 15, 20];

function loadCounterState() {
  try {
    const raw = localStorage.getItem("toolhub.counter");
    if (raw) {
      const state = JSON.parse(raw);
      if (!Array.isArray(state.history)) state.history = [];
      if (typeof state.showHistory !== "boolean") state.showHistory = false;
      if (!Array.isArray(state.names)) state.names = [];
      if (typeof state.showNames !== "boolean") state.showNames = false;
      return state;
    }
  } catch (e) {}
  return { value: 0, step: 5, history: [], showHistory: false, names: [], showNames: false };
}

function showCounterNameOverlay(onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "counter-name-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="counter-name-card">
      <div class="counter-name-title">ใส่ชื่อ</div>
      <input type="text" id="counterNameInput" class="counter-name-input" placeholder="พิมพ์ชื่อ..." />
      <div class="counter-name-actions">
        <button class="reset-btn" id="counterNameCancel">ยกเลิก</button>
        <button class="counter-name-confirm" id="counterNameConfirm">ตกลง</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");

  const input = overlay.querySelector("#counterNameInput");
  input.focus();

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector("#counterNameCancel").addEventListener("click", () => overlay.remove());
  overlay.querySelector("#counterNameConfirm").addEventListener("click", () => {
    const name = input.value.trim();
    if (!name) return;
    overlay.remove();
    onConfirm(name);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") overlay.querySelector("#counterNameConfirm").click();
  });
}

function addToNameTotal(state, name, delta) {
  const existing = state.names.find((n) => n.name === name);
  if (existing) existing.total += delta;
  else state.names.push({ name, total: delta });
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
      <div class="counter-names" id="namesSection"></div>
      <div class="counter-history" id="historySection"></div>
      <div class="counter-display-wrap" id="displayWrap">
        <div class="counter-display" id="display">${state.value}</div>
      </div>
      <div class="name-tag-row">
        <button class="name-tag-btn give" id="nameGiveBtn">🏷️ ให้...</button>
        <button class="name-tag-btn receive" id="nameReceiveBtn">🏷️ ได้...</button>
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
  const displayWrap = container.querySelector("#displayWrap");
  const chips = container.querySelectorAll(".step-chip[data-step]");
  const customBtn = container.querySelector("#customStep");

  function animateCountUp(fromValue, toValue) {
    const duration = 400;
    const startTime = performance.now();

    function frame(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = t < 1 ? Math.round(fromValue + (toValue - fromValue) * eased) : toValue;
      display.textContent = current;
      display.classList.toggle("negative", current < 0);
      if (t < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function playChangeAnimation(delta) {
    display.classList.remove("bump");
    void display.offsetWidth;
    display.classList.add("bump");

    const float = document.createElement("div");
    float.className = `counter-float ${delta > 0 ? "plus" : "minus"}`;
    float.textContent = `${delta > 0 ? "+" : ""}${delta}`;
    displayWrap.appendChild(float);
    setTimeout(() => float.remove(), 700);
  }

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
    const oldValue = state.value;
    state.value += state.step;
    state.history.unshift({ delta: state.step, time: Date.now() });
    saveCounterState(state);
    animateCountUp(oldValue, state.value);
    playChangeAnimation(state.step);
    renderHistorySection();
  });

  container.querySelector("#minus").addEventListener("click", () => {
    const oldValue = state.value;
    state.value -= state.step;
    state.history.unshift({ delta: -state.step, time: Date.now() });
    saveCounterState(state);
    animateCountUp(oldValue, state.value);
    playChangeAnimation(-state.step);
    renderHistorySection();
  });

  container.querySelector("#nameGiveBtn").addEventListener("click", () => {
    showCounterNameOverlay((name) => {
      const oldValue = state.value;
      state.value -= state.step;
      state.history.unshift({ delta: -state.step, time: Date.now() });
      addToNameTotal(state, name, -state.step);
      saveCounterState(state);
      animateCountUp(oldValue, state.value);
      playChangeAnimation(-state.step);
      renderHistorySection();
      renderNamesSection();
    });
  });

  container.querySelector("#nameReceiveBtn").addEventListener("click", () => {
    showCounterNameOverlay((name) => {
      const oldValue = state.value;
      state.value += state.step;
      state.history.unshift({ delta: state.step, time: Date.now() });
      addToNameTotal(state, name, state.step);
      saveCounterState(state);
      animateCountUp(oldValue, state.value);
      playChangeAnimation(state.step);
      renderHistorySection();
      renderNamesSection();
    });
  });

  container.querySelector("#reset").addEventListener("click", () => {
    const oldValue = state.value;
    if (oldValue !== 0) {
      state.history.unshift({ delta: -oldValue, time: Date.now(), isReset: true });
    }
    state.value = 0;
    saveCounterState(state);
    updateDisplay();
    renderHistorySection();
  });

  function renderHistorySection() {
    const box = container.querySelector("#historySection");
    const count = state.history.length;
    box.innerHTML = `
      <button class="counter-history-toggle" id="historyToggle" title="ประวัติ">
        ประวัติ${count > 0 ? `<span class="counter-history-badge">${count}</span>` : ""}
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
                          }${h.delta}${h.isReset ? " (รีเซ็ต)" : ""}</span>
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

  function renderNamesSection() {
    const box = container.querySelector("#namesSection");
    const count = state.names.length;
    box.innerHTML = `
      <button class="counter-history-toggle" id="namesToggle" title="รายชื่อ">
        รายชื่อ${count > 0 ? `<span class="counter-history-badge">${count}</span>` : ""}
      </button>
      ${
        state.showNames
          ? `<div class="counter-history-panel">
              <div class="counter-history-panel-head">
                <span>รายชื่อ</span>
                ${count > 0 ? `<button class="counter-history-clear" id="namesClearAll">ลบทั้งหมด</button>` : ""}
              </div>
              <div class="counter-history-list">
                ${
                  count === 0
                    ? `<div class="counter-history-empty">ยังไม่มีรายชื่อ</div>`
                    : state.names
                        .map((n, i) => {
                          const statusClass = n.total < 0 ? "owe" : n.total > 0 ? "owed" : "settled";
                          const statusText =
                            n.total < 0
                              ? `ต้องให้ ${n.name} จำนวน ${Math.abs(n.total)}`
                              : n.total > 0
                              ? `ต้องได้ ${n.name} จำนวน ${n.total}`
                              : `${n.name} เคลียร์แล้ว`;
                          return `
                  <div class="counter-history-item">
                    <span class="counter-name-status ${statusClass}">${statusText}</span>
                    <button class="counter-history-del" data-i="${i}">×</button>
                  </div>
                `;
                        })
                        .join("")
                }
              </div>
            </div>`
          : ""
      }
    `;

    box.querySelector("#namesToggle").addEventListener("click", () => {
      state.showNames = !state.showNames;
      saveCounterState(state);
      renderNamesSection();
    });

    const clearAllBtn = box.querySelector("#namesClearAll");
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", () => {
        if (!confirm("ลบรายชื่อทั้งหมด?")) return;
        state.names = [];
        saveCounterState(state);
        renderNamesSection();
      });
    }

    box.querySelectorAll(".counter-history-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.names.splice(Number(btn.dataset.i), 1);
        saveCounterState(state);
        renderNamesSection();
      });
    });
  }

  updateChipHighlight();
  updateDisplay();
  renderHistorySection();
  renderNamesSection();
}
