// คิดเลขเร็ว (flash math quiz) — tab in the เกม hub (registered in GAME_TABS,
// tools/games-core.js). Shows a problem for 3s, hides it, then gives 5s to answer —
// either typed or multiple-choice (configurable choice count). Correct answers chain
// into a streak; problems get harder as the streak grows, starting from a selectable
// starting level (settings.startLevel) instead of always level 0. No dependency on
// other tool files.

const MATH_SHOW_MS = 3000;
const MATH_ANSWER_MS = 5000;
const MATH_BEST_KEY = "toolhub.mathquiz.bestStreak";
const MATH_SETTINGS_KEY = "toolhub.mathquiz.settings";
const MATH_CHOICE_COUNTS = [2, 3, 4, 6];
const MATH_MAX_LEVEL = 6;
// Per-level tuning — gaps between levels widen on purpose (not linear) so higher levels
// feel meaningfully harder, not just slightly harder. factorMax null = no multiplication yet.
const MATH_LEVEL_LABELS = ["ง่ายมาก", "ง่าย", "ปานกลาง", "ยาก", "ยากมาก", "โหด", "นรก"];
const MATH_LEVEL_RANGES = [9, 20, 35, 55, 80, 115, 160];
const MATH_LEVEL_FACTOR_MAX = [null, null, 9, 13, 18, 24, 32];

function loadMathBest() {
  try {
    return parseInt(localStorage.getItem(MATH_BEST_KEY) || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

function saveMathBest(v) {
  try {
    localStorage.setItem(MATH_BEST_KEY, String(v));
  } catch (e) {}
}

function loadMathSettings() {
  try {
    const raw = localStorage.getItem(MATH_SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        mode: s.mode === "choice" ? "choice" : "type",
        choiceCount: MATH_CHOICE_COUNTS.includes(s.choiceCount) ? s.choiceCount : 4,
        startLevel: Number.isInteger(s.startLevel) && s.startLevel >= 0 && s.startLevel <= MATH_MAX_LEVEL ? s.startLevel : 0,
      };
    }
  } catch (e) {}
  return { mode: "type", choiceCount: 4, startLevel: 0 };
}

function saveMathSettings(settings) {
  localStorage.setItem(MATH_SETTINGS_KEY, JSON.stringify(settings));
}

function mathRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mathShuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function mathGenerateProblem(level) {
  const factorMax = MATH_LEVEL_FACTOR_MAX[level];
  const ops = factorMax === null ? ["+", "−"] : ["+", "−", "×"];
  const op = ops[mathRandInt(0, ops.length - 1)];
  const range = MATH_LEVEL_RANGES[level];
  let a, b, answer;
  if (op === "+") {
    a = mathRandInt(1, range);
    b = mathRandInt(1, range);
    answer = a + b;
  } else if (op === "−") {
    a = mathRandInt(1, range);
    b = mathRandInt(1, a);
    answer = a - b;
  } else {
    a = mathRandInt(2, factorMax);
    b = mathRandInt(2, factorMax);
    answer = a * b;
  }
  return { text: `${a} ${op} ${b}`, answer };
}

function mathGenerateChoices(answer, count) {
  const choices = new Set([answer]);
  let guard = 0;
  while (choices.size < count && guard < 200) {
    guard++;
    const offset = mathRandInt(1, Math.max(3, Math.round(Math.abs(answer) * 0.2) + 3));
    const candidate = answer + (Math.random() < 0.5 ? -offset : offset);
    if (candidate >= 0) choices.add(candidate);
  }
  return mathShuffle([...choices]);
}

function renderMathQuiz(container) {
  let best = loadMathBest();
  let settings = loadMathSettings();

  container.innerHTML = `
    <div class="math-body">
      <div class="math-score-row">
        <span>สเตรก <b id="mathStreak">0</b></span>
        <span>เวลา <b id="mathTimer">0</b> วิ</span>
        <span>สถิติ <b id="mathBest">${best}</b></span>
      </div>
      <div class="math-board-wrap">
        <div class="math-stage" id="mathStage"></div>
        <div class="math-overlay" id="mathOverlay">
          <div class="math-overlay-title" id="mathOverlayTitle"></div>
          <div class="math-overlay-sub" id="mathOverlaySub"></div>
          <button class="math-start-btn" id="mathRestartBtn">เล่นใหม่</button>
        </div>
      </div>
    </div>
  `;

  const stage = container.querySelector("#mathStage");
  const overlay = container.querySelector("#mathOverlay");
  const overlayTitle = container.querySelector("#mathOverlayTitle");
  const overlaySub = container.querySelector("#mathOverlaySub");
  const streakEl = container.querySelector("#mathStreak");
  const timerEl = container.querySelector("#mathTimer");
  const bestEl = container.querySelector("#mathBest");

  let streak, elapsed, problem, phaseTimer, elapsedTimer, running;

  function clearTimers() {
    clearInterval(phaseTimer);
    clearInterval(elapsedTimer);
  }

  function startElapsedClock() {
    clearInterval(elapsedTimer);
    elapsedTimer = setInterval(() => {
      elapsed += 1;
      timerEl.textContent = String(elapsed);
    }, 1000);
  }

  function showIdle() {
    stage.innerHTML = `
      <div class="math-prompt">
        <div class="math-prompt-title">🧮 คิดเลขเร็ว</div>
        <div class="math-prompt-sub">ดูโจทย์ 3 วิ แล้วตอบให้ทันภายใน 5 วิ ตอบถูกต่อเนื่องยาวๆ เก็บสเตรก</div>
        <div class="math-mode-row">
          <button class="math-mode-btn ${settings.mode === "type" ? "active" : ""}" data-mode="type">พิมพ์ตอบ</button>
          <button class="math-mode-btn ${settings.mode === "choice" ? "active" : ""}" data-mode="choice">เลือกตอบ</button>
        </div>
        ${
          settings.mode === "choice"
            ? `<div class="math-choice-count-row" id="mathChoiceCountRow">
                <span class="math-choice-count-label">จำนวนช้อย</span>
                ${MATH_CHOICE_COUNTS.map(
                  (n) => `<button class="math-choice-count-btn ${settings.choiceCount === n ? "active" : ""}" data-count="${n}">${n}</button>`
                ).join("")}
              </div>`
            : ""
        }
        <div class="math-level-row" id="mathLevelRow">
          <span class="math-level-label">ระดับเริ่มต้น</span>
          ${Array.from(
            { length: MATH_MAX_LEVEL + 1 },
            (_, lvl) => `<button class="math-level-btn ${settings.startLevel === lvl ? "active" : ""}" data-level="${lvl}">${MATH_LEVEL_LABELS[lvl]}</button>`
          ).join("")}
        </div>
        <button class="math-start-btn" id="mathStartBtn">เริ่ม</button>
      </div>
    `;
    stage.querySelectorAll(".math-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.mode = btn.dataset.mode;
        saveMathSettings(settings);
        showIdle();
      });
    });
    const choiceCountRow = stage.querySelector("#mathChoiceCountRow");
    if (choiceCountRow) {
      choiceCountRow.querySelectorAll(".math-choice-count-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          settings.choiceCount = Number(btn.dataset.count);
          saveMathSettings(settings);
          showIdle();
        });
      });
    }
    stage.querySelectorAll(".math-level-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.startLevel = Number(btn.dataset.level);
        saveMathSettings(settings);
        showIdle();
      });
    });
    stage.querySelector("#mathStartBtn").addEventListener("click", startRun);
  }

  function startRun() {
    streak = 0;
    elapsed = 0;
    running = true;
    streakEl.textContent = "0";
    timerEl.textContent = "0";
    overlay.classList.remove("show");
    startElapsedClock();
    nextProblem();
  }

  function nextProblem() {
    const level = Math.min(settings.startLevel + Math.floor(streak / 3), MATH_MAX_LEVEL);
    problem = mathGenerateProblem(level);
    showQuestion();
  }

  function showQuestion() {
    let count = 3;
    stage.innerHTML = `
      <div class="math-question">
        <div class="math-question-countdown" id="mathShowCountdown">${count}</div>
        <div class="math-question-text">${problem.text}</div>
      </div>
    `;
    const countdownEl = stage.querySelector("#mathShowCountdown");
    clearInterval(phaseTimer);
    phaseTimer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(phaseTimer);
        showAnswerPhase();
        return;
      }
      countdownEl.textContent = String(count);
    }, MATH_SHOW_MS / 3);
  }

  function showAnswerPhase() {
    if (settings.mode === "choice") showChoiceAnswer();
    else showTypedAnswer();
  }

  function startAnswerCountdown(countdownEl, onTimeout) {
    let count = MATH_ANSWER_MS / 1000;
    clearInterval(phaseTimer);
    phaseTimer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(phaseTimer);
        onTimeout();
        return;
      }
      countdownEl.textContent = String(count);
    }, 1000);
  }

  function showChoiceAnswer() {
    const choices = mathGenerateChoices(problem.answer, settings.choiceCount);
    stage.innerHTML = `
      <div class="math-answer">
        <div class="math-answer-countdown" id="mathAnswerCountdown">${MATH_ANSWER_MS / 1000}</div>
        <div class="math-choice-grid">
          ${choices.map((c) => `<button class="math-choice-btn" data-val="${c}">${c}</button>`).join("")}
        </div>
        <button class="math-giveup-btn" id="mathGiveupBtn">ยอมแพ้</button>
      </div>
    `;
    stage.querySelectorAll(".math-choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        clearInterval(phaseTimer);
        if (Number(btn.dataset.val) === problem.answer) handleCorrect();
        else endRun(false);
      });
    });
    stage.querySelector("#mathGiveupBtn").addEventListener("click", () => {
      clearInterval(phaseTimer);
      endRun(true);
    });
    startAnswerCountdown(stage.querySelector("#mathAnswerCountdown"), () => endRun(false));
  }

  function showTypedAnswer() {
    stage.innerHTML = `
      <div class="math-answer">
        <div class="math-answer-countdown" id="mathAnswerCountdown">${MATH_ANSWER_MS / 1000}</div>
        <input type="number" inputmode="numeric" class="math-answer-input" id="mathAnswerInput" placeholder="คำตอบ" />
        <div class="math-answer-actions">
          <button class="math-answer-btn" id="mathSubmitBtn">ตอบ</button>
          <button class="math-giveup-btn" id="mathGiveupBtn">ยอมแพ้</button>
        </div>
      </div>
    `;
    const input = stage.querySelector("#mathAnswerInput");
    input.focus();

    function submit() {
      clearInterval(phaseTimer);
      const value = Number(input.value);
      if (input.value.trim() !== "" && value === problem.answer) handleCorrect();
      else endRun(false);
    }

    stage.querySelector("#mathSubmitBtn").addEventListener("click", submit);
    stage.querySelector("#mathGiveupBtn").addEventListener("click", () => {
      clearInterval(phaseTimer);
      endRun(true);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    startAnswerCountdown(stage.querySelector("#mathAnswerCountdown"), () => endRun(false));
  }

  function handleCorrect() {
    streak += 1;
    streakEl.textContent = String(streak);
    stage.innerHTML = `<div class="math-flash">✅ ถูกต้อง!</div>`;
    setTimeout(() => {
      if (running) nextProblem();
    }, 500);
  }

  function endRun(gaveUp) {
    running = false;
    clearTimers();
    if (streak > best) {
      best = streak;
      saveMathBest(best);
      bestEl.textContent = String(best);
    }
    overlayTitle.textContent = gaveUp ? "🏳️ ยอมแพ้" : "❌ ตอบผิด/หมดเวลา";
    overlaySub.textContent = `เลขที่ถูกต้องคือ ${problem.answer} — ได้สเตรก ${streak}, เวลารวม ${elapsed} วิ`;
    overlay.classList.add("show");
  }

  container.querySelector("#mathRestartBtn").addEventListener("click", startRun);

  showIdle();
}
