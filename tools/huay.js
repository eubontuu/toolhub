// หวย — full-screen app (renderHuay, registered in APPS in app.js). สุ่มเลขหวย เลือกจำนวน
// หลักได้ (2/3/6 ตัว). แยกออกมาจากวงเหล้าเป็นแอปเดี่ยวแล้ว — เคยเป็นแถบในนั้นมาก่อน (ดู
// migration ใน loadHuayState ด้านล่าง สำหรับข้อมูลเก่าที่ยังอยู่ใน toolhub.wonglao).

const HUAY_DIGIT_OPTIONS = [
  { n: 2, label: "2 ตัวท้าย" },
  { n: 3, label: "3 ตัวท้าย" },
  { n: 6, label: "6 ตัว (เต็ม)" },
];
const HUAY_HISTORY_MAX = 30;

function loadHuayState() {
  try {
    const raw = localStorage.getItem("toolhub.huay");
    if (raw) {
      const state = JSON.parse(raw);
      if (typeof state.digits !== "number") state.digits = 6;
      if (typeof state.last !== "string") state.last = null;
      // locked[i] เป็น "0".."9" (ล็อกตำแหน่งนั้นไว้ที่เลขนี้) หรือ null (ไม่ล็อก) — ค่าเก่าที่ไม่ใช่รูปแบบนี้ (เช่น boolean จากเวอร์ชันก่อนหน้า) ถือว่าไม่ล็อก
      if (!Array.isArray(state.locked)) state.locked = [];
      state.locked = state.locked.map((v) => (typeof v === "string" && /^[0-9]$/.test(v) ? v : null));
      if (!Array.isArray(state.history)) state.history = [];
      state.history = state.history.filter((h) => h && typeof h.value === "string" && typeof h.time === "number");
      return state;
    }
    // one-time migration: หวย used to be a sub-game inside toolhub.wonglao before this split
    const oldRaw = localStorage.getItem("toolhub.wonglao");
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      if (old.huayDigits || old.huayLast) {
        return { digits: old.huayDigits || 6, last: old.huayLast || null, locked: [], history: [] };
      }
    }
  } catch (e) {}
  return { digits: 6, last: null, locked: [], history: [] };
}

function huayFormatTime(ts) {
  return new Date(ts).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

function saveHuayState(state) {
  localStorage.setItem("toolhub.huay", JSON.stringify(state));
}

function huayBallsHtml(digits, lastDigits, locked) {
  return Array.from({ length: digits })
    .map((_, i) => {
      const lockedDigit = locked && locked[i] !== null && locked[i] !== undefined ? locked[i] : null;
      const displayDigit = lockedDigit !== null ? lockedDigit : lastDigits ? lastDigits[i] : null;
      return `
    <div class="huay-ball ${displayDigit === null ? "placeholder" : ""} ${lockedDigit !== null ? "locked" : ""}" data-idx="${i}">
      <span>${displayDigit === null ? "?" : displayDigit}</span>
      ${lockedDigit !== null ? '<span class="huay-lock-icon">🔒</span>' : ""}
    </div>`;
    })
    .join("");
}

function renderHuay(container) {
  const state = loadHuayState();

  // ตัด/เติม state.locked ให้ยาวเท่าจำนวนหลักปัจจุบันเสมอ (จำนวนหลักเปลี่ยนได้ระหว่างทาง)
  function normalizeLocked(digits) {
    if (state.locked.length === digits) return;
    while (state.locked.length < digits) state.locked.push(null);
    state.locked.length = digits;
    saveHuayState(state);
  }

  function rollHuay() {
    const digits = state.digits || 6;
    normalizeLocked(digits);
    const finalDigits = Array.from({ length: digits }, (_, i) =>
      state.locked[i] !== null ? state.locked[i] : String(Math.floor(Math.random() * 10))
    );
    const finalVal = finalDigits.join("");

    const balls = [...container.querySelectorAll(".huay-ball")];
    // ตำแหน่งที่ล็อกไว้ (เลือกเลขไว้ตายตัว) ไม่ต้องหมุน คงเลขที่ล็อกไว้
    const spinIdx = balls.map((_, i) => i).filter((i) => state.locked[i] === null);
    spinIdx.forEach((i) => balls[i].classList.remove("placeholder", "settled"));

    function finish() {
      state.last = finalVal;
      state.history.unshift({ value: finalVal, digits, time: Date.now() });
      if (state.history.length > HUAY_HISTORY_MAX) state.history.length = HUAY_HISTORY_MAX;
      saveHuayState(state);
      showHuayOverlay(finalVal, rollHuay);
    }

    if (!spinIdx.length) {
      finish();
      return;
    }

    const stopTicks = {};
    spinIdx.forEach((i, order) => (stopTicks[i] = 14 + order * 3));
    const maxTicks = Math.max(...spinIdx.map((i) => stopTicks[i]));
    let ticks = 0;
    const spin = setInterval(() => {
      spinIdx.forEach((i) => {
        const span = balls[i].querySelector("span");
        if (ticks < stopTicks[i]) {
          span.textContent = Math.floor(Math.random() * 10);
        } else if (ticks === stopTicks[i]) {
          span.textContent = finalDigits[i];
          balls[i].classList.add("settled");
        }
      });
      ticks++;
      if (ticks > maxTicks) {
        clearInterval(spin);
        finish();
      }
    }, 70);
  }

  function draw() {
    const digits = state.digits || 6;
    normalizeLocked(digits);
    const lastDigits = state.last && state.last.length === digits ? state.last.split("") : null;

    container.innerHTML = `
      <div class="huay-wrap">
        <div class="huay-display-row" id="huayDisplay">${huayBallsHtml(digits, lastDigits, state.locked)}</div>
        <div class="huay-lock-hint">แตะตำแหน่งไหนก็ได้เพื่อเลือกเลขล็อกไว้ — ตำแหน่งที่ล็อกจะไม่ถูกสุ่มใหม่</div>
        <div class="step-row">
          <div class="step-label">เลือกจำนวนหลัก</div>
          ${HUAY_DIGIT_OPTIONS.map(
            (o) => `<button class="step-chip ${digits === o.n ? "active" : ""}" data-digits="${o.n}">${o.label}</button>`
          ).join("")}
        </div>
        <div class="huay-action-row">
          <button class="huay-action-btn" id="huayDrawBtn">สุ่มใหม่</button>
          <button class="huay-history-btn" id="huayHistoryBtn">📜 ประวัติ${state.history.length ? ` (${state.history.length})` : ""}</button>
        </div>
      </div>
    `;

    container.querySelectorAll(".step-chip[data-digits]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.digits = Number(chip.dataset.digits);
        saveHuayState(state);
        draw();
      });
    });

    container.querySelector("#huayHistoryBtn").addEventListener("click", () => {
      showHuayHistoryOverlay(state.history, () => {
        state.history = [];
        saveHuayState(state);
        draw();
      });
    });

    container.querySelector("#huayDrawBtn").addEventListener("click", rollHuay);
  }

  // event delegation — ใช้ได้กับลูกบอลทุกชุดที่ draw() วาดใหม่ ไม่ต้องผูก listener ซ้ำ
  container.addEventListener("click", (e) => {
    const ball = e.target.closest(".huay-ball[data-idx]");
    if (!ball) return;
    const idx = Number(ball.dataset.idx);
    showHuayLockPicker(idx, state.locked[idx], (digit) => {
      state.locked[idx] = digit;
      saveHuayState(state);
      draw();
    });
  });

  draw();
}

function showHuayOverlay(value, onRollAgain) {
  const overlay = document.createElement("div");
  overlay.className = "huay-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="huay-overlay-row">${value
      .split("")
      .map((d) => `<div class="huay-overlay-ball"><span>${d}</span></div>`)
      .join("")}</div>
    ${onRollAgain ? `<button class="huay-overlay-next-btn" id="huayOverlayNextBtn">สุ่มอีกชุด</button>` : ""}
    <div class="huay-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  if (onRollAgain) {
    overlay.querySelector("#huayOverlayNextBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.remove();
      onRollAgain();
    });
  }
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}

function showHuayHistoryOverlay(history, onClearAll) {
  const overlay = document.createElement("div");
  overlay.className = "huay-lockpicker-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="huay-lockpicker-panel huay-history-panel">
      <div class="huay-lockpicker-title">ประวัติการสุ่ม</div>
      <div class="huay-history-list">
        ${
          history.length === 0
            ? `<div class="huay-history-empty">ยังไม่มีประวัติ</div>`
            : history
                .map(
                  (h) => `
          <div class="huay-history-item">
            <span class="huay-history-value">${h.value}</span>
            <span class="huay-history-time">${huayFormatTime(h.time)}</span>
          </div>`
                )
                .join("")
        }
      </div>
      ${history.length > 0 ? `<button class="huay-lockpicker-unlock" id="huayHistoryClearBtn">ล้างประวัติ</button>` : ""}
    </div>
    <div class="huay-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".huay-lockpicker-panel").addEventListener("click", (e) => e.stopPropagation());
  const clearBtn = overlay.querySelector("#huayHistoryClearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      overlay.remove();
      onClearAll();
    });
  }
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}

function showHuayLockPicker(idx, currentDigit, onPick) {
  const overlay = document.createElement("div");
  overlay.className = "huay-lockpicker-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="huay-lockpicker-panel">
      <div class="huay-lockpicker-title">เลือกเลขล็อกตำแหน่งที่ ${idx + 1}</div>
      <div class="huay-lockpicker-grid">
        ${Array.from(
          { length: 10 },
          (_, d) => `<button class="huay-lockpicker-digit ${String(d) === currentDigit ? "active" : ""}" data-digit="${d}">${d}</button>`
        ).join("")}
      </div>
      ${currentDigit !== null ? `<button class="huay-lockpicker-unlock" id="huayLockUnlockBtn">ปลดล็อกตำแหน่งนี้</button>` : ""}
    </div>
    <div class="huay-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".huay-lockpicker-panel").addEventListener("click", (e) => e.stopPropagation());
  overlay.querySelectorAll(".huay-lockpicker-digit").forEach((btn) => {
    btn.addEventListener("click", () => {
      onPick(btn.dataset.digit);
      overlay.remove();
    });
  });
  const unlockBtn = overlay.querySelector("#huayLockUnlockBtn");
  if (unlockBtn) {
    unlockBtn.addEventListener("click", () => {
      onPick(null);
      overlay.remove();
    });
  }
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
