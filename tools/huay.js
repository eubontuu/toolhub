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
      return state;
    }
    // one-time migration: หวย used to be a sub-game inside toolhub.wonglao before this split
    const oldRaw = localStorage.getItem("toolhub.wonglao");
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      if (old.huayDigits || old.huayLast) {
        return { digits: old.huayDigits || 6, last: old.huayLast || null };
      }
    }
  } catch (e) {}
  return { digits: 6, last: null };
}

function saveHuayState(state) {
  localStorage.setItem("toolhub.huay", JSON.stringify(state));
}

function huayRandomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function huayBallsHtml(digits, lastDigits) {
  return Array.from({ length: digits })
    .map(
      (_, i) => `
    <div class="huay-ball ${lastDigits ? "" : "placeholder"}">
      <span>${lastDigits ? lastDigits[i] : "?"}</span>
    </div>`
    )
    .join("");
}

function renderHuay(container) {
  const state = loadHuayState();

  function draw() {
    const digits = state.digits || 6;
    const lastDigits = state.last && state.last.length === digits ? state.last.split("") : null;

    container.innerHTML = `
      <div class="huay-wrap">
        <div class="huay-display-row" id="huayDisplay">${huayBallsHtml(digits, lastDigits)}</div>
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

    container.querySelector("#huayDrawBtn").addEventListener("click", () => {
      const finalVal = huayRandomDigits(digits);
      const balls = [...container.querySelectorAll(".huay-ball")];
      balls.forEach((b) => {
        b.classList.remove("placeholder", "settled");
      });
      const stopTicks = balls.map((_, i) => 14 + i * 3);
      const maxTicks = Math.max(...stopTicks);
      let ticks = 0;
      const spin = setInterval(() => {
        balls.forEach((ball, i) => {
          const span = ball.querySelector("span");
          if (ticks < stopTicks[i]) {
            span.textContent = Math.floor(Math.random() * 10);
          } else if (ticks === stopTicks[i]) {
            span.textContent = finalVal[i];
            ball.classList.add("settled");
          }
        });
        ticks++;
        if (ticks > maxTicks) {
          clearInterval(spin);
          state.last = finalVal;
          saveHuayState(state);
          showHuayOverlay(finalVal);
        }
      }, 70);
    });
  }

  draw();
}

function showHuayOverlay(value) {
  const overlay = document.createElement("div");
  overlay.className = "huay-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="huay-overlay-row">${value
      .split("")
      .map((d) => `<div class="huay-overlay-ball"><span>${d}</span></div>`)
      .join("")}</div>
    <div class="huay-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
