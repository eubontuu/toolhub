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

function renderHuayGame(body, state) {
  function draw() {
    const digits = state.huayDigits || 6;
    const lastDigits = state.huayLast && state.huayLast.length === digits ? state.huayLast.split("") : null;

    body.innerHTML = `
      <div class="huay-wrap">
        <div class="huay-display-row" id="huayDisplay">${huayBallsHtml(digits, lastDigits)}</div>
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
      const finalVal = huayRandomDigits(digits);
      const balls = [...body.querySelectorAll(".huay-ball")];
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
