// หวย — สุ่มเลขหวย เลือกจำนวนหลักได้ (2/3/6 ตัว) — depends on saveWongLaoState (wonglao-core.js, must load first)

const HUAY_DIGIT_OPTIONS = [
  { n: 2, label: "2 ตัวท้าย" },
  { n: 3, label: "3 ตัวท้าย" },
  { n: 6, label: "6 ตัว (เต็ม)" },
];

function huayRandomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function renderHuayGame(body, state) {
  function draw() {
    const digits = state.huayDigits || 6;
    body.innerHTML = `
      <div class="huay-wrap">
        <div class="huay-display ${state.huayLast ? "" : "empty"}" id="huayDisplay">${state.huayLast || "?"}</div>
        <div class="step-row">
          <div class="step-label">เลือกจำนวนหลัก</div>
          ${HUAY_DIGIT_OPTIONS.map(
            (o) => `<button class="step-chip ${digits === o.n ? "active" : ""}" data-digits="${o.n}">${o.label}</button>`
          ).join("")}
        </div>
        <button class="wl-action-btn" id="huayDrawBtn">สุ่มใหม่</button>
      </div>
    `;

    body.querySelectorAll(".step-chip[data-digits]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.huayDigits = Number(chip.dataset.digits);
        saveWongLaoState(state);
        draw();
      });
    });

    body.querySelector("#huayDrawBtn").addEventListener("click", () => {
      const display = body.querySelector("#huayDisplay");
      display.classList.remove("empty");
      let ticks = 0;
      const spin = setInterval(() => {
        display.textContent = huayRandomDigits(digits);
        ticks++;
        if (ticks > 12) {
          clearInterval(spin);
          const finalVal = huayRandomDigits(digits);
          display.textContent = finalVal;
          state.huayLast = finalVal;
          saveWongLaoState(state);
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
    <div class="huay-overlay-ticket"><span>${value}</span></div>
    <div class="huay-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
