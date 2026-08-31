// หวย — full-screen app (renderHuay, registered in APPS in app.js). สุ่มเลขหวย เลือกจำนวน
// หลักได้ (2/3/6 ตัว). แยกออกมาจากวงเหล้าเป็นแอปเดี่ยวแล้ว — เคยเป็นแถบในนั้นมาก่อน (ดู
// migration ใน loadHuayState ด้านล่าง สำหรับข้อมูลเก่าที่ยังอยู่ใน toolhub.wonglao).

const HUAY_DIGIT_OPTIONS = [
  { n: 2, label: "2 ตัวท้าย" },
  { n: 3, label: "3 ตัวท้าย" },
  { n: 6, label: "6 ตัว (เต็ม)" },
];

function loadHuayState() {
  try {
    const raw = localStorage.getItem("toolhub.huay");
    if (raw) {
      const state = JSON.parse(raw);
      if (typeof state.digits !== "number") state.digits = 6;
      if (typeof state.last !== "string") state.last = null;
      if (!Array.isArray(state.locked)) state.locked = [];
      return state;
    }
    // one-time migration: หวย used to be a sub-game inside toolhub.wonglao before this split
    const oldRaw = localStorage.getItem("toolhub.wonglao");
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      if (old.huayDigits || old.huayLast) {
        return { digits: old.huayDigits || 6, last: old.huayLast || null, locked: [] };
      }
    }
  } catch (e) {}
  return { digits: 6, last: null, locked: [] };
}

function saveHuayState(state) {
  localStorage.setItem("toolhub.huay", JSON.stringify(state));
}

function huayBallsHtml(digits, lastDigits, locked) {
  return Array.from({ length: digits })
    .map((_, i) => {
      const isLocked = !!(lastDigits && locked && locked[i]);
      return `
    <div class="huay-ball ${lastDigits ? "" : "placeholder"} ${isLocked ? "locked" : ""}" data-idx="${i}">
      <span>${lastDigits ? lastDigits[i] : "?"}</span>
      ${isLocked ? '<span class="huay-lock-icon">🔒</span>' : ""}
    </div>`;
    })
    .join("");
}

function renderHuay(container) {
  const state = loadHuayState();

  // ตัด/เติม state.locked ให้ยาวเท่าจำนวนหลักปัจจุบันเสมอ (จำนวนหลักเปลี่ยนได้ระหว่างทาง)
  function normalizeLocked(digits) {
    if (state.locked.length === digits) return;
    while (state.locked.length < digits) state.locked.push(false);
    state.locked.length = digits;
    saveHuayState(state);
  }

  function rollHuay() {
    const digits = state.digits || 6;
    normalizeLocked(digits);
    const prevDigits = state.last && state.last.length === digits ? state.last.split("") : null;
    const finalDigits = Array.from({ length: digits }, (_, i) =>
      prevDigits && state.locked[i] ? prevDigits[i] : String(Math.floor(Math.random() * 10))
    );
    const finalVal = finalDigits.join("");

    const balls = [...container.querySelectorAll(".huay-ball")];
    // ตำแหน่งที่ล็อกไว้ (และมีเลขเดิมอยู่แล้ว) ไม่ต้องหมุน คงเลขเดิมไว้
    const spinIdx = balls.map((_, i) => i).filter((i) => !(prevDigits && state.locked[i]));
    spinIdx.forEach((i) => balls[i].classList.remove("placeholder", "settled"));

    function finish() {
      state.last = finalVal;
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
        ${lastDigits ? `<div class="huay-lock-hint">แตะเลขเพื่อล็อกตำแหน่ง — ตัวที่ล็อกไว้จะไม่ถูกสุ่มใหม่</div>` : ""}
        <div class="step-row">
          <div class="step-label">เลือกจำนวนหลัก</div>
          ${HUAY_DIGIT_OPTIONS.map(
            (o) => `<button class="step-chip ${digits === o.n ? "active" : ""}" data-digits="${o.n}">${o.label}</button>`
          ).join("")}
        </div>
        <button class="huay-action-btn" id="huayDrawBtn">สุ่มใหม่</button>
      </div>
    `;

    container.querySelectorAll(".step-chip[data-digits]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.digits = Number(chip.dataset.digits);
        saveHuayState(state);
        draw();
      });
    });

    container.querySelector("#huayDrawBtn").addEventListener("click", rollHuay);
  }

  // event delegation — ใช้ได้กับลูกบอลทุกชุดที่ draw() วาดใหม่ ไม่ต้องผูก listener ซ้ำ
  container.addEventListener("click", (e) => {
    const ball = e.target.closest(".huay-ball[data-idx]");
    if (!ball || ball.classList.contains("placeholder")) return;
    const idx = Number(ball.dataset.idx);
    state.locked[idx] = !state.locked[idx];
    saveHuayState(state);
    ball.classList.toggle("locked", state.locked[idx]);
    let icon = ball.querySelector(".huay-lock-icon");
    if (state.locked[idx]) {
      if (!icon) {
        icon = document.createElement("span");
        icon.className = "huay-lock-icon";
        icon.textContent = "🔒";
        ball.appendChild(icon);
      }
    } else if (icon) {
      icon.remove();
    }
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
