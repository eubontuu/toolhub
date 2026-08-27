// เกมทายเลข — no dependency on other tool files

const GUESS_RANGE_OPTIONS = [50, 100, 200, 1000];

function newGuessGame(range, best) {
  return {
    range,
    target: 1 + Math.floor(Math.random() * range),
    guesses: [],
    finished: false,
    best: best ?? null,
  };
}

function loadGuessState() {
  try {
    const raw = localStorage.getItem("toolhub.guessnumber");
    if (raw) {
      const state = JSON.parse(raw);
      if (!Array.isArray(state.guesses)) state.guesses = [];
      if (typeof state.range !== "number") state.range = 100;
      if (typeof state.finished !== "boolean") state.finished = false;
      if (typeof state.best !== "number") state.best = null;
      if (typeof state.target !== "number") state.target = 1 + Math.floor(Math.random() * state.range);
      return state;
    }
  } catch (e) {}
  return newGuessGame(100, null);
}

function saveGuessState(state) {
  localStorage.setItem("toolhub.guessnumber", JSON.stringify(state));
}

function showGuessWinOverlay(guessCount, isNewBest, onPlayAgain) {
  const overlay = document.createElement("div");
  overlay.className = "guess-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="guess-overlay-card">
      <div class="guess-overlay-emoji">🎉</div>
      <div class="guess-overlay-title">ทายถูกแล้ว!</div>
      <div class="guess-overlay-sub">ใช้ไป ${guessCount} ครั้ง${isNewBest ? " — สถิติใหม่!" : ""}</div>
      <button class="guess-overlay-next-btn" id="guessOverlayPlayAgain">เล่นใหม่</button>
    </div>
    <div class="guess-overlay-hint">แตะที่ว่างเพื่อปิด</div>
  `;
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.querySelector("#guessOverlayPlayAgain").addEventListener("click", (e) => {
    e.stopPropagation();
    overlay.remove();
    onPlayAgain();
  });
}

function renderGuessNumber(container) {
  let state = loadGuessState();

  function startNewGame(range) {
    state = newGuessGame(range, state.best);
    saveGuessState(state);
    draw();
  }

  function submitGuess(rawValue) {
    if (state.finished) return;
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 1 || value > state.range) {
      draw(`กรอกเลข 1-${state.range} นะ`, "warn");
      return;
    }
    const result = value === state.target ? "correct" : value < state.target ? "low" : "high";
    state.guesses.push({ value, result });

    if (result === "correct") {
      state.finished = true;
      const isNewBest = state.best === null || state.guesses.length < state.best;
      if (isNewBest) state.best = state.guesses.length;
      saveGuessState(state);
      draw();
      showGuessWinOverlay(state.guesses.length, isNewBest, () => startNewGame(state.range));
      return;
    }

    saveGuessState(state);
    draw(result === "low" ? "ทายต่ำไป ลองเลขที่สูงขึ้น" : "ทายสูงไป ลองเลขที่ต่ำลง", result);
  }

  function draw(feedbackText, feedbackClass) {
    container.innerHTML = `
      <div class="guess-wrap">
        <div class="step-row">
          <div class="step-label">เลือกช่วงตัวเลข</div>
          ${GUESS_RANGE_OPTIONS.map((n) => `<button class="step-chip" data-range="${n}">1-${n}</button>`).join("")}
          <button class="step-chip" id="guessCustomRange">กำหนดเอง</button>
        </div>
        <div class="guess-range-text">ทายเลข 1-${state.range}${
      state.best !== null ? ` · สถิติดีที่สุด ${state.best} ครั้ง` : ""
    }</div>
        <div class="guess-input-row">
          <input type="number" id="guessInput" class="guess-input" placeholder="พิมพ์ตัวเลข..." min="1" max="${
            state.range
          }" ${state.finished ? "disabled" : ""} />
          <button class="guess-submit-btn" id="guessSubmitBtn" ${state.finished ? "disabled" : ""}>ทาย</button>
        </div>
        <div class="guess-feedback ${feedbackClass || ""}">${feedbackText || ""}</div>
        <div class="guess-count">ทายไปแล้ว ${state.guesses.length} ครั้ง</div>
        <div class="guess-history">
          ${state.guesses
            .map(
              (g) =>
                `<span class="guess-chip ${g.result}">${g.value}${
                  g.result === "low" ? " ↑" : g.result === "high" ? " ↓" : " ✓"
                }</span>`
            )
            .join("")}
        </div>
        <button class="reset-btn" id="guessRestartBtn">เริ่มเกมใหม่</button>
      </div>
    `;

    container.querySelectorAll(".step-chip[data-range]").forEach((chip) => {
      chip.classList.toggle("active", Number(chip.dataset.range) === state.range);
      chip.addEventListener("click", () => startNewGame(Number(chip.dataset.range)));
    });

    const customBtn = container.querySelector("#guessCustomRange");
    const isCustomRange = !GUESS_RANGE_OPTIONS.includes(state.range);
    customBtn.classList.toggle("active", isCustomRange);
    customBtn.textContent = isCustomRange ? `กำหนดเอง (${state.range})` : "กำหนดเอง";
    customBtn.addEventListener("click", () => {
      const input = prompt("กำหนดช่วงตัวเลข (ทาย 1 ถึง...)", state.range);
      if (input === null) return;
      const n = Math.floor(Number(input));
      if (!Number.isFinite(n) || n < 2) return;
      startNewGame(n);
    });

    container.querySelector("#guessRestartBtn").addEventListener("click", () => startNewGame(state.range));

    const input = container.querySelector("#guessInput");
    if (!state.finished) {
      container.querySelector("#guessSubmitBtn").addEventListener("click", () => submitGuess(input.value));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitGuess(input.value);
      });
      input.focus();
    }
  }

  draw();
}
