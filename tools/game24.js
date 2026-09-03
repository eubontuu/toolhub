// เกม 24 — tab in the เกม hub (registered in GAME_TABS, tools/games-core.js). Combine number
// chips two at a time with +/−/×/÷ until one chip remains; hit the target to win.
// "ธรรมดา" is the classic 4-number-make-24 puzzle — g24GenerateNormal() keeps redrawing
// until g24Solvable() confirms the hand can hit exactly 24, so every round is solvable.
// "แอดวานซ์" lets you pick how many numbers are given (settings.advCount) and how many
// digits the target has (settings.advDigits); those combos aren't solvability-checked, so
// the pass condition relaxes to within ±G24_ADV_TOLERANCE of the target instead of an exact
// hit. No dependency on other tool files.

const G24_SETTINGS_KEY = "toolhub.game24.settings";
const G24_NUMBER_MIN = 1;
const G24_NUMBER_MAX = 9;
const G24_TARGET_NORMAL = 24;
const G24_ADV_DIGIT_OPTIONS = [1, 2, 3];
const G24_ADV_COUNT_OPTIONS = [3, 4, 5, 6];
const G24_ADV_TOLERANCE = 5;
const G24_EPSILON = 1e-6;

function g24RandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadG24Settings() {
  try {
    const raw = localStorage.getItem(G24_SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        mode: s.mode === "advanced" ? "advanced" : "normal",
        advDigits: G24_ADV_DIGIT_OPTIONS.includes(s.advDigits) ? s.advDigits : 2,
        advCount: G24_ADV_COUNT_OPTIONS.includes(s.advCount) ? s.advCount : 4,
      };
    }
  } catch (e) {}
  return { mode: "normal", advDigits: 2, advCount: 4 };
}

function saveG24Settings(settings) {
  localStorage.setItem(G24_SETTINGS_KEY, JSON.stringify(settings));
}

// Recursively tries every way to combine the remaining numbers pairwise (this implicitly
// covers every parenthesization — reducing any two first, in any order, is equivalent to
// trying every grouping) until one value is left; true if that value can equal target.
function g24Solvable(nums, target) {
  if (nums.length === 1) return Math.abs(nums[0] - target) < G24_EPSILON;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue;
      const rest = nums.filter((_, k) => k !== i && k !== j);
      const a = nums[i];
      const b = nums[j];
      const candidates = [a + b, a - b, a * b];
      if (Math.abs(b) > G24_EPSILON) candidates.push(a / b);
      for (const c of candidates) {
        if (g24Solvable([...rest, c], target)) return true;
      }
    }
  }
  return false;
}

function g24GenerateNormal() {
  let numbers;
  let guard = 0;
  do {
    numbers = Array.from({ length: 4 }, () => g24RandInt(G24_NUMBER_MIN, G24_NUMBER_MAX));
    guard++;
  } while (!g24Solvable(numbers, G24_TARGET_NORMAL) && guard < 500);
  return { numbers, target: G24_TARGET_NORMAL, tolerance: 0 };
}

function g24GenerateAdvanced(count, digits) {
  const numbers = Array.from({ length: count }, () => g24RandInt(G24_NUMBER_MIN, G24_NUMBER_MAX));
  const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const target = g24RandInt(min, max);
  return { numbers, target, tolerance: G24_ADV_TOLERANCE };
}

function g24FormatNum(v) {
  const rounded = Math.round(v * 10000) / 10000;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded.toFixed(2)).replace(/0+$/, "").replace(/\.$/, "");
}

function renderGame24(container) {
  const settings = loadG24Settings();
  let target, tolerance, chips, originalChips, selected, history, nextChipId;

  function showIdle() {
    container.innerHTML = `
      <div class="g24-body">
        <div class="g24-idle">
          <div class="g24-idle-title">🔢 เกม 24</div>
          <div class="g24-idle-sub">รวมตัวเลขทีละคู่ด้วย + − × ÷ ให้ได้เป้าหมาย</div>
          <div class="g24-mode-row">
            <button class="g24-mode-btn ${settings.mode === "normal" ? "active" : ""}" data-mode="normal">ธรรมดา</button>
            <button class="g24-mode-btn ${settings.mode === "advanced" ? "active" : ""}" data-mode="advanced">แอดวานซ์</button>
          </div>
          ${
            settings.mode === "advanced"
              ? `
          <div class="g24-adv-row">
            <span class="g24-adv-label">จำนวนตัวเลข</span>
            ${G24_ADV_COUNT_OPTIONS.map(
              (n) => `<button class="g24-adv-btn ${settings.advCount === n ? "active" : ""}" data-count="${n}">${n}</button>`
            ).join("")}
          </div>
          <div class="g24-adv-row">
            <span class="g24-adv-label">เลขเป้าหมายกี่หลัก</span>
            ${G24_ADV_DIGIT_OPTIONS.map(
              (n) => `<button class="g24-adv-btn ${settings.advDigits === n ? "active" : ""}" data-digits="${n}">${n}</button>`
            ).join("")}
          </div>
          <div class="g24-adv-hint">ผ่านได้ถ้าผลลัพธ์ห่างจากเป้าหมายไม่เกิน ±${G24_ADV_TOLERANCE}</div>
          `
              : `<div class="g24-adv-hint">รวมเลข 4 ตัวให้ได้ ${G24_TARGET_NORMAL} พอดี — ทุกโจทย์มีคำตอบเสมอ</div>`
          }
          <button class="g24-start-btn" id="g24StartBtn">เริ่มเกม</button>
        </div>
      </div>
    `;
    container.querySelectorAll(".g24-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.mode = btn.dataset.mode;
        saveG24Settings(settings);
        showIdle();
      });
    });
    container.querySelectorAll(".g24-adv-btn[data-count]").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.advCount = Number(btn.dataset.count);
        saveG24Settings(settings);
        showIdle();
      });
    });
    container.querySelectorAll(".g24-adv-btn[data-digits]").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.advDigits = Number(btn.dataset.digits);
        saveG24Settings(settings);
        showIdle();
      });
    });
    container.querySelector("#g24StartBtn").addEventListener("click", startGame);
  }

  function startGame() {
    container.innerHTML = `<div class="g24-body"><div class="g24-loading">กำลังสร้างโจทย์...</div></div>`;
    setTimeout(() => {
      const gen = settings.mode === "advanced" ? g24GenerateAdvanced(settings.advCount, settings.advDigits) : g24GenerateNormal();
      target = gen.target;
      tolerance = gen.tolerance;
      originalChips = gen.numbers.map((v, i) => ({ id: `n${i}`, value: v }));
      nextChipId = originalChips.length;
      chips = originalChips.map((c) => ({ ...c }));
      history = [];
      selected = [];
      renderBoard();
    }, 30);
  }

  function resetToOriginal() {
    chips = originalChips.map((c) => ({ ...c }));
    history = [];
    selected = [];
    renderBoard();
  }

  function renderBoard() {
    container.innerHTML = `
      <div class="g24-body">
        <div class="g24-score-row">
          <span>เป้าหมาย <b>${target}</b>${tolerance ? ` (±${tolerance})` : ""}</span>
          <button class="g24-new-btn" id="g24NewBtn">ตั้งค่า</button>
        </div>
        <div class="g24-board-wrap">
          <div class="g24-chip-row" id="g24ChipRow">
            ${chips
              .map(
                (c) =>
                  `<button class="g24-chip ${selected.some((s) => s.id === c.id) ? "selected" : ""}" data-id="${c.id}">${g24FormatNum(c.value)}</button>`
              )
              .join("")}
          </div>
          ${
            selected.length === 2
              ? `<div class="g24-op-row" id="g24OpRow">
                  <button class="g24-op-btn" data-op="+">+</button>
                  <button class="g24-op-btn" data-op="-">−</button>
                  <button class="g24-op-btn" data-op="*">×</button>
                  <button class="g24-op-btn" data-op="/" ${Math.abs(selected[1].value) < G24_EPSILON ? "disabled" : ""}>÷</button>
                </div>`
              : `<div class="g24-hint">${chips.length > 1 ? "แตะตัวเลข 2 ตัวเพื่อเลือกมารวมกัน" : ""}</div>`
          }
          <div class="g24-overlay" id="g24Overlay">
            <div class="g24-overlay-title" id="g24OverlayTitle"></div>
            <div class="g24-overlay-sub" id="g24OverlaySub"></div>
            <div class="g24-overlay-actions">
              <button class="g24-start-btn" id="g24PlayAgainBtn">เลขชุดใหม่</button>
              <button class="g24-secondary-btn" id="g24RetryBtn">ลองเลขเดิม</button>
            </div>
          </div>
        </div>
        <div class="g24-controls-row">
          <button class="g24-secondary-btn" id="g24UndoBtn" ${history.length === 0 ? "disabled" : ""}>↩ ย้อนกลับ</button>
          <button class="g24-secondary-btn" id="g24ResetBtn">⟲ เลขเดิม</button>
          <button class="g24-secondary-btn" id="g24ShuffleBtn">🔀 สุ่มใหม่</button>
        </div>
      </div>
    `;

    container.querySelectorAll(".g24-chip").forEach((btn) => {
      btn.addEventListener("click", () => toggleChip(btn.dataset.id));
    });
    const opRow = container.querySelector("#g24OpRow");
    if (opRow) {
      opRow.querySelectorAll(".g24-op-btn:not(:disabled)").forEach((btn) => {
        btn.addEventListener("click", () => combine(btn.dataset.op));
      });
    }
    container.querySelector("#g24NewBtn").addEventListener("click", showIdle);
    container.querySelector("#g24UndoBtn").addEventListener("click", undo);
    container.querySelector("#g24ResetBtn").addEventListener("click", resetToOriginal);
    container.querySelector("#g24ShuffleBtn").addEventListener("click", startGame);

    if (chips.length === 1) checkWin();
  }

  function toggleChip(id) {
    if (selected.some((s) => s.id === id)) {
      selected = selected.filter((s) => s.id !== id);
      renderBoard();
      return;
    }
    const chip = chips.find((c) => c.id === id);
    if (!chip) return;
    selected = selected.length >= 2 ? [chip] : [...selected, chip];
    renderBoard();
  }

  function combine(op) {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    let value;
    if (op === "+") value = a.value + b.value;
    else if (op === "-") value = a.value - b.value;
    else if (op === "*") value = a.value * b.value;
    else {
      if (Math.abs(b.value) < G24_EPSILON) return;
      value = a.value / b.value;
    }
    history.push(chips);
    const newChip = { id: `n${nextChipId++}`, value };
    chips = [...chips.filter((c) => c.id !== a.id && c.id !== b.id), newChip];
    selected = [];
    renderBoard();
  }

  function undo() {
    if (history.length === 0) return;
    chips = history.pop();
    selected = [];
    renderBoard();
  }

  function checkWin() {
    const value = chips[0].value;
    const diff = Math.abs(value - target);
    const passed = tolerance ? diff <= tolerance : diff < G24_EPSILON;
    const overlay = container.querySelector("#g24Overlay");
    container.querySelector("#g24OverlayTitle").textContent = passed ? "🎉 สำเร็จ!" : "❌ ไม่ตรงเป้าหมาย";
    container.querySelector("#g24OverlaySub").textContent = passed
      ? `ได้ ${g24FormatNum(value)} ตรงเป้าหมาย ${target}${tolerance ? ` (คลาดเคลื่อน ${g24FormatNum(diff)})` : ""}`
      : `ได้ ${g24FormatNum(value)} ห่างจากเป้าหมาย ${target} อยู่ ${g24FormatNum(diff)}`;
    overlay.classList.add("show");
    container.querySelector("#g24PlayAgainBtn").addEventListener("click", startGame);
    container.querySelector("#g24RetryBtn").addEventListener("click", resetToOriginal);
  }

  showIdle();
}
