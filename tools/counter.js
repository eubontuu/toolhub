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
      if (typeof state.historyPinned !== "boolean") state.historyPinned = true;
      return state;
    }
  } catch (e) {}
  return { value: 0, step: 5, history: [], showHistory: false, names: [], showNames: false, historyPinned: true };
}

function showCounterNameOverlay(state, direction, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "counter-name-overlay reveal-overlay";
  const knownNames = [...new Set(state.names.map((n) => n.name))];
  const directionLabel = direction === "give" ? "ให้" : "ได้";

  overlay.innerHTML = `
    <div class="counter-name-card">
      <div class="counter-name-title">เพิ่มไปยังรายชื่อ</div>
      <div class="counter-name-direction-badge ${direction}">${directionLabel}</div>
      <input type="text" id="counterNameInput" class="counter-name-input" placeholder="พิมพ์ชื่อ..." />
      ${
        knownNames.length > 0
          ? `<div class="counter-name-chip-row">
              ${knownNames.map((n) => `<button class="counter-name-chip" data-name="${n}">${n}</button>`).join("")}
            </div>`
          : ""
      }
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

  overlay.querySelectorAll(".counter-name-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.dataset.name;
      input.focus();
    });
  });

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
        <div class="streak-glow-bg" id="streakGlowBg"></div>
        <div class="streak-ring" id="streakRing"></div>
        <div class="streak-badge" id="streakBadge"></div>
        <div class="counter-display" id="display">${state.value}</div>
      </div>
      <div class="name-tag-row">
        <button class="name-tag-btn single" id="addToNamesBtn">🏷️ เพิ่มไปยังรายชื่อ</button>
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
  const streakBadge = container.querySelector("#streakBadge");
  const streakRing = container.querySelector("#streakRing");
  const chips = container.querySelectorAll(".step-chip[data-step]");
  const customBtn = container.querySelector("#customStep");

  let streak = 0;
  let streakDir = null;
  let lastTier = 0;

  const STREAK_TIER_COLORS = {
    plus: { 1: "#ffd60a", 2: "#22d3ee", 3: "#c026d3" },
    minus: { 1: "#3d4870", 2: "#1e3a8a", 3: "#1e1b4b" },
  };
  const STREAK_EMOJI = { plus: "🔥", minus: "😢" };

  function streakTier(count) {
    if (count >= 10) return 3;
    if (count >= 5) return 2;
    if (count >= 3) return 1;
    return 0;
  }

  function spawnStreakParticles(tier, direction) {
    for (let i = 0; i < tier; i++) {
      const p = document.createElement("div");
      p.className = "streak-particle";
      const angle = (Math.random() - 0.5) * 80;
      const dist = 70 + Math.random() * 50;
      p.style.setProperty("--angle", `${angle}deg`);
      p.style.setProperty("--dist", `${dist}px`);
      p.textContent = STREAK_EMOJI[direction];
      displayWrap.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  }

  function triggerLevelUpFlash(tier, direction) {
    const color = STREAK_TIER_COLORS[direction][tier];
    if (!color) return;
    const flash = document.createElement("div");
    flash.className = "streak-flash";
    flash.style.background = `radial-gradient(circle at 50% 38%, ${color} 0%, transparent 70%)`;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  function triggerStreakBurst(tier, direction, leveledUp) {
    streakRing.classList.remove("burst");
    void streakRing.offsetWidth;
    streakRing.classList.add("burst");
    spawnStreakParticles(tier, direction);
    if (leveledUp) triggerLevelUpFlash(tier, direction);
    try {
      if (navigator.vibrate) navigator.vibrate(leveledUp ? [30, 40, 30] : 20);
    } catch (e) {}
  }

  function updateStreakEffect() {
    const tier = streakTier(streak);
    displayWrap.classList.remove(
      "streak-plus-1", "streak-plus-2", "streak-plus-3",
      "streak-minus-1", "streak-minus-2", "streak-minus-3"
    );
    if (tier > 0) {
      displayWrap.classList.add(`streak-${streakDir}-${tier}`);
      streakBadge.textContent = `${STREAK_EMOJI[streakDir]} ×${streak}`;
      streakBadge.classList.add("show");
      triggerStreakBurst(tier, streakDir, tier > lastTier);
    } else {
      streakBadge.classList.remove("show");
    }
    lastTier = tier;
  }

  function bumpStreak(direction) {
    streak = direction === streakDir ? streak + 1 : 1;
    streakDir = direction;
    updateStreakEffect();
  }

  function resetStreak() {
    streak = 0;
    streakDir = null;
    updateStreakEffect();
  }

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
    if (state.showHistory && !state.historyPinned) state.showHistory = false;
    saveCounterState(state);
    animateCountUp(oldValue, state.value);
    playChangeAnimation(state.step);
    bumpStreak("plus");
    renderHistorySection();
  });

  container.querySelector("#minus").addEventListener("click", () => {
    const oldValue = state.value;
    state.value -= state.step;
    state.history.unshift({ delta: -state.step, time: Date.now() });
    if (state.showHistory && !state.historyPinned) state.showHistory = false;
    saveCounterState(state);
    animateCountUp(oldValue, state.value);
    playChangeAnimation(-state.step);
    bumpStreak("minus");
    renderHistorySection();
  });

  container.querySelector("#addToNamesBtn").addEventListener("click", () => {
    if (state.value === 0) {
      alert("เลขมันเป็น 0 ไอเอ๋อมึงจะเพิ่มราชื่อไปทำไม น้ำลายยืดจัด");
      return;
    }
    const direction = state.value < 0 ? "give" : "receive";
    showCounterNameOverlay(state, direction, (name) => {
      const oldValue = state.value;
      const delta = oldValue;
      state.value = 0;
      state.history.unshift({ delta, time: Date.now() });
      addToNameTotal(state, name, delta);
      saveCounterState(state);
      animateCountUp(oldValue, state.value);
      playChangeAnimation(delta);
      resetStreak();
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
    resetStreak();
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
                <div class="counter-history-panel-head-left">
                  <button class="counter-history-pin ${state.historyPinned ? "active" : ""}" id="historyPinToggle" title="${
                    state.historyPinned ? "ปักหมุดค้างไว้ — กดบวก/ลบจะไม่ปิดหน้านี้ (กดเพื่อเปลี่ยน)" : "ไม่ได้ปักหมุด — กดบวก/ลบจะปิดหน้านี้อัตโนมัติ (กดเพื่อเปลี่ยน)"
                  }">📌 ${state.historyPinned ? "ค้างไว้" : "ปิดอัตโนมัติ"}</button>
                  <span>ประวัติ</span>
                </div>
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

    const pinBtn = box.querySelector("#historyPinToggle");
    if (pinBtn) {
      pinBtn.addEventListener("click", () => {
        state.historyPinned = !state.historyPinned;
        saveCounterState(state);
        renderHistorySection();
      });
    }

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
                              ? `ต้องได้จาก ${n.name} จำนวน ${n.total}`
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
