// วงล้อ — depends on saveWongLaoState (tools/wonglao-core.js, must load first)

const WHEEL_MAX_OPTIONS = [6, 10, 20, 52];

function renderWheelGame(body, state) {
  function draw() {
    body.innerHTML = `
      <div class="wheel-wrap">
        <div class="wheel-display ${state.wheelLast === null ? "empty" : ""}" id="wheelDisplay">${
          state.wheelLast === null ? "?" : state.wheelLast
        }</div>
        <div class="step-row">
          <div class="step-label">เลือกเลขสูงสุด (สุ่มตั้งแต่ 1 ถึงเลขนี้)</div>
          ${WHEEL_MAX_OPTIONS.map(
            (n) => `<button class="step-chip ${state.wheelMax === n ? "active" : ""}" data-max="${n}">${n}</button>`
          ).join("")}
          <button class="step-chip" id="wheelCustomMax">กำหนดเอง</button>
        </div>
        <button class="wl-action-btn" id="spinBtn">หมุน</button>
      </div>
    `;

    body.querySelectorAll(".step-chip[data-max]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.wheelMax = Number(chip.dataset.max);
        saveWongLaoState(state);
        draw();
      });
    });

    body.querySelector("#wheelCustomMax").addEventListener("click", () => {
      const input = prompt("กำหนดเลขสูงสุด (สุ่มตั้งแต่ 1 ถึงเลขนี้)", state.wheelMax);
      if (input === null) return;
      const n = Number(input);
      if (!Number.isInteger(n) || n < 2) return;
      state.wheelMax = n;
      saveWongLaoState(state);
      draw();
    });

    body.querySelector("#spinBtn").addEventListener("click", () => {
      const display = body.querySelector("#wheelDisplay");
      display.classList.remove("empty");
      let ticks = 0;
      const spin = setInterval(() => {
        display.textContent = String(1 + Math.floor(Math.random() * state.wheelMax));
        ticks++;
        if (ticks > 12) {
          clearInterval(spin);
          const finalVal = 1 + Math.floor(Math.random() * state.wheelMax);
          display.textContent = finalVal;
          state.wheelLast = finalVal;
          saveWongLaoState(state);
          showWheelOverlay(finalVal);
        }
      }, 70);
    });
  }

  draw();
}

function showWheelOverlay(value) {
  const overlay = document.createElement("div");
  overlay.className = "wheel-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="wheel-overlay-circle"><span>${value}</span></div>
    <div class="wheel-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
