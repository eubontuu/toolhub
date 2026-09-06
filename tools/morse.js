// รหัสมอส — full-screen app (renderMorse, registered in APPS in app.js). One tap button (telegraph
// key): short tap = จุด (.), press-and-hold = ขีด (-). 3 modes:
//   "single"   ทีละตัวอักษร — decodes one letter at a time into a big display, never touches the sentence buffer
//   "sentence" ต่อประโยค — decodes straight into a growing sentence (word gap auto-inserts a space)
//   "combined" รวม — does both of the above at once
// Mode only changes what a decoded letter is used for — the tap/decode timing logic itself is identical
// across all 3 modes.

const MORSE_DOT_MAX_MS = 250; // press duration <= this = dot, else dash
const MORSE_LETTER_GAP_MS = 900; // silence after the last symbol => decode currentSymbols into a letter
const MORSE_WORD_GAP_MS = 1800; // silence *before* a letter's first symbol >= this => insert a space first (sentence/combined)

const MORSE_MAP = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
  6: "-....", 7: "--...", 8: "---..", 9: "----.",
};
const MORSE_REVERSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([letter, code]) => [code, letter]));

// Binary tree of the letters only (digits are a fixed 5-symbol pattern, shown as a plain table
// instead — see morseDigitTableHtml). Every node (leaf or not) is itself a decodable letter, since
// e.g. "T" is valid on its own even though N/M branch further off it. Root has no letter — it's just
// the antenna/start point a real Morse tree card begins from.
const MORSE_TREE = {
  letter: null,
  dot: {
    letter: "E",
    dot: {
      letter: "I",
      dot: { letter: "S", dot: { letter: "H" }, dash: { letter: "V" } },
      dash: { letter: "U", dot: { letter: "F" } },
    },
    dash: {
      letter: "A",
      dot: { letter: "R", dot: { letter: "L" } },
      dash: { letter: "W", dot: { letter: "P" }, dash: { letter: "J" } },
    },
  },
  dash: {
    letter: "T",
    dot: {
      letter: "N",
      dot: { letter: "D", dot: { letter: "B" }, dash: { letter: "X" } },
      dash: { letter: "K", dot: { letter: "C" }, dash: { letter: "Y" } },
    },
    dash: {
      letter: "M",
      dot: { letter: "G", dot: { letter: "Z" }, dash: { letter: "Q" } },
      dash: { letter: "O" },
    },
  },
};

function loadMorseState() {
  try {
    const raw = localStorage.getItem("toolhub.morse");
    if (raw) {
      const s = JSON.parse(raw);
      return {
        mode: ["single", "sentence", "combined"].includes(s.mode) ? s.mode : "single",
        sentence: typeof s.sentence === "string" ? s.sentence : "",
      };
    }
  } catch (e) {}
  return { mode: "single", sentence: "" };
}

function saveMorseState(state) {
  localStorage.setItem("toolhub.morse", JSON.stringify(state));
}

// Lays the tree out by leaf order (x) / path length (y), then renders it as one inline SVG.
// Every node/edge carries data-path="<dots/dashes to reach it>" so a live path can be highlighted.
function morseTreeSvg() {
  const nodes = [];
  let leafCounter = 0;

  function walk(node, path) {
    const hasDot = !!node.dot;
    const hasDash = !!node.dash;
    let x;
    if (!hasDot && !hasDash) {
      x = leafCounter++;
    } else {
      const xs = [];
      if (hasDot) xs.push(walk(node.dot, path + "."));
      if (hasDash) xs.push(walk(node.dash, path + "-"));
      x = xs.reduce((a, b) => a + b, 0) / xs.length;
    }
    nodes.push({ path, letter: node.letter, x, y: path.length });
    return x;
  }
  walk(MORSE_TREE, "");

  const colW = 40;
  const rowH = 46;
  const width = leafCounter * colW + 20;
  const height = 5 * rowH + 20;
  const px = (n) => 10 + n.x * colW + colW / 2;
  const py = (n) => 10 + n.y * rowH + rowH / 2;
  const byPath = Object.fromEntries(nodes.map((n) => [n.path, n]));

  let edgesHtml = "";
  let nodesHtml = "";
  nodes.forEach((n) => {
    if (n.path !== "") {
      const parent = byPath[n.path.slice(0, -1)];
      edgesHtml += `<line class="morse-tree-edge" data-path="${n.path}" x1="${px(parent)}" y1="${py(parent)}" x2="${px(n)}" y2="${py(n)}" />`;
    }
    nodesHtml += `
      <g class="morse-tree-node" data-path="${n.path}">
        <circle cx="${px(n)}" cy="${py(n)}" r="${n.path === "" ? 5 : 14}" />
        ${n.letter ? `<text x="${px(n)}" y="${py(n)}" dy="0.32em">${n.letter}</text>` : ""}
      </g>`;
  });

  return `<svg viewBox="0 0 ${width} ${height}" class="morse-tree-svg" preserveAspectRatio="xMidYMid meet">${edgesHtml}${nodesHtml}</svg>`;
}

function morseDigitTableHtml() {
  const digits = "0123456789".split("");
  return `
    <div class="morse-digit-table">
      ${digits
        .map((d) => `<div class="morse-digit-cell"><span class="morse-digit-num">${d}</span><span class="morse-digit-code">${MORSE_MAP[d]}</span></div>`)
        .join("")}
    </div>`;
}

function renderMorse(container) {
  const state = loadMorseState();

  container.innerHTML = `
    <div class="morse-wrap">
      <div class="morse-mode-row">
        <button class="morse-mode-btn" data-mode="single">ทีละตัวอักษร</button>
        <button class="morse-mode-btn" data-mode="sentence">ต่อประโยค</button>
        <button class="morse-mode-btn" data-mode="combined">รวม</button>
      </div>

      <div class="morse-output">
        <div class="morse-big-letter" id="morseBigLetter">•</div>
        <div class="morse-sentence-box" id="morseSentenceBox">
          <div class="morse-sentence-text" id="morseSentenceText"></div>
        </div>
      </div>

      <div class="morse-trail" id="morseTrail">&nbsp;</div>

      <button class="morse-key-btn" id="morseKeyBtn" aria-label="ปุ่มส่งรหัสมอส"></button>
      <div class="morse-hint">แตะสั้น = จุด (•) &nbsp;•&nbsp; กดค้าง = ขีด (–)</div>

      <div class="morse-actions" id="morseActions">
        <button class="morse-action-btn" id="morseBackspaceBtn">⌫ ลบตัวล่าสุด</button>
        <button class="morse-action-btn" id="morseClearBtn">🗑️ ล้างทั้งหมด</button>
      </div>

      <button class="morse-tree-toggle-btn" id="morseTreeToggleBtn">📖 ผังรหัสมอส</button>
      <div class="morse-tree-panel" id="morseTreePanel" hidden>
        <div class="morse-tree-legend">เริ่มจากจุดตรงกลาง — จุด (•) ไปทางซ้าย, ขีด (–) ไปทางขวา</div>
        ${morseTreeSvg()}
        <div class="morse-digit-label">ตัวเลข 0-9</div>
        ${morseDigitTableHtml()}
      </div>
    </div>
  `;

  const modeBtns = container.querySelectorAll(".morse-mode-btn");
  const bigLetterEl = container.querySelector("#morseBigLetter");
  const sentenceBoxEl = container.querySelector("#morseSentenceBox");
  const sentenceTextEl = container.querySelector("#morseSentenceText");
  const trailEl = container.querySelector("#morseTrail");
  const keyBtn = container.querySelector("#morseKeyBtn");
  const actionsEl = container.querySelector("#morseActions");
  const treeToggleBtn = container.querySelector("#morseTreeToggleBtn");
  const treePanel = container.querySelector("#morseTreePanel");

  let currentSymbols = [];
  let letterTimer = null;
  let pressStart = null;
  let lastSymbolEndTime = 0;
  let pendingWordSpace = false;

  function updateModeVisibility() {
    modeBtns.forEach((b) => b.classList.toggle("active", b.dataset.mode === state.mode));
    const showBig = state.mode === "single" || state.mode === "combined";
    const showSentence = state.mode === "sentence" || state.mode === "combined";
    bigLetterEl.hidden = !showBig;
    sentenceBoxEl.hidden = !showSentence;
    actionsEl.hidden = !showSentence;
  }

  function updateSentenceDisplay() {
    sentenceTextEl.textContent = state.sentence || "แตะปุ่มด้านล่างเพื่อเริ่มต่อประโยค...";
    sentenceTextEl.classList.toggle("placeholder", !state.sentence);
    sentenceBoxEl.scrollLeft = sentenceBoxEl.scrollWidth;
  }

  function updateTrail() {
    trailEl.innerHTML = currentSymbols.length
      ? currentSymbols.map((s) => `<span class="morse-trail-sym ${s === "." ? "dot" : "dash"}">${s === "." ? "•" : "–"}</span>`).join("")
      : "&nbsp;";
  }

  function updateTreeHighlight() {
    if (treePanel.hidden) return;
    treePanel.querySelectorAll(".active").forEach((el) => el.classList.remove("active", "current"));
    const path = currentSymbols.join("");
    for (let i = 0; i <= path.length; i++) {
      const prefix = path.slice(0, i);
      treePanel.querySelectorAll(`[data-path="${prefix}"]`).forEach((el) => {
        el.classList.add("active");
        if (i === path.length) el.classList.add("current");
      });
    }
  }

  function flashBigLetter(letter) {
    bigLetterEl.textContent = letter;
    bigLetterEl.classList.remove("flash");
    void bigLetterEl.offsetHeight;
    bigLetterEl.classList.add("flash");
  }

  function finishLetter() {
    const code = currentSymbols.join("");
    const letter = MORSE_REVERSE[code] || "?";

    if (state.mode === "single" || state.mode === "combined") flashBigLetter(letter);

    if (state.mode === "sentence" || state.mode === "combined") {
      if (pendingWordSpace && state.sentence.length > 0) state.sentence += " ";
      state.sentence += letter;
      saveMorseState(state);
      updateSentenceDisplay();
    }

    pendingWordSpace = false;
    currentSymbols = [];
    updateTrail();
    updateTreeHighlight();
  }

  function registerSymbol(sym, pressStartTime) {
    if (currentSymbols.length === 0 && lastSymbolEndTime > 0 && pressStartTime - lastSymbolEndTime >= MORSE_WORD_GAP_MS) {
      pendingWordSpace = true;
    }
    currentSymbols.push(sym);
    updateTrail();
    updateTreeHighlight();
    clearTimeout(letterTimer);
    letterTimer = setTimeout(finishLetter, MORSE_LETTER_GAP_MS);
  }

  function endPress() {
    if (pressStart == null) return;
    const start = pressStart;
    pressStart = null;
    keyBtn.classList.remove("pressed");
    const dur = performance.now() - start;
    registerSymbol(dur <= MORSE_DOT_MAX_MS ? "." : "-", start);
    lastSymbolEndTime = performance.now();
  }

  keyBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pressStart = performance.now();
    keyBtn.classList.add("pressed");
  });
  keyBtn.addEventListener("pointerup", endPress);
  keyBtn.addEventListener("pointerleave", () => {
    pressStart = null;
    keyBtn.classList.remove("pressed");
  });
  keyBtn.addEventListener("pointercancel", () => {
    pressStart = null;
    keyBtn.classList.remove("pressed");
  });
  keyBtn.addEventListener("contextmenu", (e) => e.preventDefault());

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.mode === state.mode) return;
      state.mode = btn.dataset.mode;
      saveMorseState(state);
      updateModeVisibility();
    });
  });

  container.querySelector("#morseBackspaceBtn").addEventListener("click", () => {
    if (!state.sentence) return;
    state.sentence = state.sentence.slice(0, -1);
    saveMorseState(state);
    updateSentenceDisplay();
  });

  container.querySelector("#morseClearBtn").addEventListener("click", () => {
    state.sentence = "";
    saveMorseState(state);
    updateSentenceDisplay();
  });

  treeToggleBtn.addEventListener("click", () => {
    treePanel.hidden = !treePanel.hidden;
    treeToggleBtn.classList.toggle("active", !treePanel.hidden);
    if (!treePanel.hidden) updateTreeHighlight();
  });

  updateModeVisibility();
  updateSentenceDisplay();
  updateTrail();
}
