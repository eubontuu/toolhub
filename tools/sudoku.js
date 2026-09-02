// ซูโดกุ — tab in the เกม hub (registered in GAME_TABS, tools/games-core.js).
// Generates a random full board, then removes cells while checking the puzzle still
// has exactly one solution (classic uniqueness-preserving digger). No dependency on
// other tool files.
// Notes mode (sudokuNotesMode, module-level like wlTabbarHidden/gameTabbarHidden — not
// persisted, resets each session): while on, tapping a number pencil-marks it into the
// selected empty cell instead of answering; setting a real value clears that cell's notes
// and strips the same number from same-row/col/box peers' notes.

const SUDOKU_SETTINGS_KEY = "toolhub.sudoku.settings";
const SUDOKU_BEST_KEY = "toolhub.sudoku.bestTime";
const SUDOKU_DIFFICULTIES = ["easy", "medium", "hard"];
const SUDOKU_DIFFICULTY_LABEL = { easy: "ง่าย", medium: "กลาง", hard: "ยาก" };
const SUDOKU_DIFFICULTY_CLUES = { easy: 44, medium: 36, hard: 30 };
const SUDOKU_HINT_COUNT = 3;

let sudokuNotesMode = false;

function loadSudokuSettings() {
  try {
    const raw = localStorage.getItem(SUDOKU_SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (SUDOKU_DIFFICULTIES.includes(s.difficulty)) return { difficulty: s.difficulty };
    }
  } catch (e) {}
  return { difficulty: "medium" };
}

function saveSudokuSettings(settings) {
  localStorage.setItem(SUDOKU_SETTINGS_KEY, JSON.stringify(settings));
}

function loadSudokuBestTimes() {
  try {
    const raw = localStorage.getItem(SUDOKU_BEST_KEY);
    if (raw) {
      const b = JSON.parse(raw);
      return {
        easy: typeof b.easy === "number" ? b.easy : null,
        medium: typeof b.medium === "number" ? b.medium : null,
        hard: typeof b.hard === "number" ? b.hard : null,
      };
    }
  } catch (e) {}
  return { easy: null, medium: null, hard: null };
}

function saveSudokuBestTimes(bestTimes) {
  localStorage.setItem(SUDOKU_BEST_KEY, JSON.stringify(bestTimes));
}

function sudokuFormatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function sudokuShuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sudokuCandidateValid(board, idx, val) {
  const row = Math.floor(idx / 9);
  const col = idx % 9;
  const boxRow = row - (row % 3);
  const boxCol = col - (col % 3);
  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === val) return false;
    if (board[i * 9 + col] === val) return false;
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r * 9 + c] === val) return false;
    }
  }
  return true;
}

function sudokuFillRandom(board) {
  const idx = board.indexOf(0);
  if (idx === -1) return true;
  const digits = sudokuShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (const d of digits) {
    if (sudokuCandidateValid(board, idx, d)) {
      board[idx] = d;
      if (sudokuFillRandom(board)) return true;
      board[idx] = 0;
    }
  }
  return false;
}

function sudokuCountSolutions(board, cap) {
  let count = 0;
  function solve() {
    if (count >= cap) return;
    const idx = board.indexOf(0);
    if (idx === -1) {
      count++;
      return;
    }
    for (let d = 1; d <= 9 && count < cap; d++) {
      if (sudokuCandidateValid(board, idx, d)) {
        board[idx] = d;
        solve();
        board[idx] = 0;
      }
    }
  }
  solve();
  return count;
}

function sudokuPeerIndices(idx) {
  const row = Math.floor(idx / 9);
  const col = idx % 9;
  const boxRow = row - (row % 3);
  const boxCol = col - (col % 3);
  const peers = new Set();
  for (let i = 0; i < 9; i++) {
    peers.add(row * 9 + i);
    peers.add(i * 9 + col);
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) peers.add(r * 9 + c);
  }
  peers.delete(idx);
  return peers;
}

function sudokuFindConflicts(board) {
  const conflicts = new Set();
  function checkGroup(indices) {
    const seen = {};
    for (const i of indices) {
      const v = board[i];
      if (!v) continue;
      (seen[v] || (seen[v] = [])).push(i);
    }
    for (const v in seen) {
      if (seen[v].length > 1) seen[v].forEach((i) => conflicts.add(i));
    }
  }
  for (let r = 0; r < 9; r++) checkGroup(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) checkGroup(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const idxs = [];
      for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) idxs.push(r * 9 + c);
      checkGroup(idxs);
    }
  }
  return conflicts;
}

function sudokuGeneratePuzzle(difficulty) {
  const solution = new Array(81).fill(0);
  sudokuFillRandom(solution);
  const puzzle = solution.slice();
  const order = sudokuShuffle(Array.from({ length: 81 }, (_, i) => i));
  const targetClues = SUDOKU_DIFFICULTY_CLUES[difficulty] || 36;
  let clues = 81;
  for (const idx of order) {
    if (clues <= targetClues) break;
    const backup = puzzle[idx];
    puzzle[idx] = 0;
    const solCount = sudokuCountSolutions(puzzle.slice(), 2);
    if (solCount === 1) clues--;
    else puzzle[idx] = backup;
  }
  return { puzzle, solution };
}

function renderSudoku(container) {
  const settings = loadSudokuSettings();
  const bestTimes = loadSudokuBestTimes();

  let puzzle, solution, given, board, notes, selected, hints, timerInterval, elapsed, running;

  function clearPeerNotes(idx, num) {
    sudokuPeerIndices(idx).forEach((i) => notes[i].delete(num));
  }

  function showIdle() {
    running = false;
    clearInterval(timerInterval);
    const best = bestTimes[settings.difficulty];
    container.innerHTML = `
      <div class="sudoku-body">
        <div class="sudoku-idle">
          <div class="sudoku-idle-title">🧩 ซูโดกุ</div>
          <div class="sudoku-idle-sub">เลือกระดับความยาก แล้วเริ่มเล่นได้เลย</div>
          <div class="sudoku-diff-row">
            ${SUDOKU_DIFFICULTIES.map(
              (d) => `<button class="sudoku-diff-btn ${settings.difficulty === d ? "active" : ""}" data-diff="${d}">${SUDOKU_DIFFICULTY_LABEL[d]}</button>`
            ).join("")}
          </div>
          <div class="sudoku-best-line">${best ? `สถิติ: ${sudokuFormatTime(best)}` : "ยังไม่มีสถิติ"}</div>
          <button class="sudoku-start-btn" id="sudokuStartBtn">เริ่มเกม</button>
        </div>
      </div>
    `;
    container.querySelectorAll(".sudoku-diff-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        settings.difficulty = btn.dataset.diff;
        saveSudokuSettings(settings);
        showIdle();
      });
    });
    container.querySelector("#sudokuStartBtn").addEventListener("click", startGame);
  }

  function startGame() {
    container.innerHTML = `<div class="sudoku-body"><div class="sudoku-loading">กำลังสร้างโจทย์...</div></div>`;
    setTimeout(() => {
      const gen = sudokuGeneratePuzzle(settings.difficulty);
      puzzle = gen.puzzle;
      solution = gen.solution;
      board = puzzle.slice();
      given = puzzle.map((v) => v !== 0);
      notes = Array.from({ length: 81 }, () => new Set());
      selected = null;
      hints = SUDOKU_HINT_COUNT;
      elapsed = 0;
      running = true;
      renderBoard();
      startTimer();
    }, 30);
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      elapsed += 1;
      const timerEl = container.querySelector("#sudokuTimer");
      if (timerEl) timerEl.textContent = sudokuFormatTime(elapsed);
    }, 1000);
  }

  function renderBoard() {
    const conflicts = sudokuFindConflicts(board);
    const selectedVal = selected !== null ? board[selected] : 0;

    container.innerHTML = `
      <div class="sudoku-body">
        <div class="sudoku-score-row">
          <span>เวลา <b id="sudokuTimer">${sudokuFormatTime(elapsed)}</b></span>
          <span>คำใบ้ <b id="sudokuHints">${hints}</b></span>
          <button class="sudoku-new-btn" id="sudokuNewBtn">เกมใหม่</button>
        </div>
        <div class="sudoku-board-wrap">
          <div class="sudoku-grid" id="sudokuGrid">
            ${board
              .map((v, i) => {
                const row = Math.floor(i / 9);
                const col = i % 9;
                const classes = ["sudoku-cell"];
                if (given[i]) classes.push("given");
                if (selected === i) classes.push("selected");
                else if (selected !== null) {
                  const sr = Math.floor(selected / 9);
                  const sc = selected % 9;
                  const sameBox = Math.floor(sr / 3) === Math.floor(row / 3) && Math.floor(sc / 3) === Math.floor(col / 3);
                  if (sr === row || sc === col || sameBox) classes.push("peer");
                }
                if (v && selectedVal && v === selectedVal) classes.push("same-value");
                if (conflicts.has(i)) classes.push("conflict");
                if (col % 3 === 2 && col !== 8) classes.push("boxline-right");
                if (row % 3 === 2 && row !== 8) classes.push("boxline-bottom");
                const cellHtml = v
                  ? String(v)
                  : notes[i].size
                  ? `<div class="sudoku-notes">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<span>${notes[i].has(n) ? n : ""}</span>`).join("")}</div>`
                  : "";
                return `<button class="${classes.join(" ")}" data-idx="${i}">${cellHtml}</button>`;
              })
              .join("")}
          </div>
          <div class="sudoku-overlay" id="sudokuOverlay">
            <div class="sudoku-overlay-title" id="sudokuOverlayTitle"></div>
            <div class="sudoku-overlay-sub" id="sudokuOverlaySub"></div>
            <button class="sudoku-start-btn" id="sudokuOverlayNewBtn">เกมใหม่</button>
          </div>
        </div>
        <div class="sudoku-numpad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="sudoku-num-btn" data-num="${n}">${n}</button>`).join("")}
          <button class="sudoku-num-btn sudoku-erase-btn" data-num="0">⌫</button>
        </div>
        <div class="sudoku-bottom-actions">
          <button class="sudoku-notes-toggle ${sudokuNotesMode ? "active" : ""}" id="sudokuNotesToggle">✏️ โน้ต${sudokuNotesMode ? ": เปิด" : ""}</button>
          <button class="sudoku-hint-btn" id="sudokuHintBtn" ${hints <= 0 ? "disabled" : ""}>💡 คำใบ้ (${hints})</button>
        </div>
      </div>
    `;

    container.querySelectorAll(".sudoku-cell").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!running) return;
        selected = Number(btn.dataset.idx);
        renderBoard();
      });
    });

    container.querySelectorAll(".sudoku-num-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!running || selected === null || given[selected]) return;
        const num = Number(btn.dataset.num);

        if (sudokuNotesMode) {
          if (num === 0) notes[selected].clear();
          else if (board[selected] === 0) {
            if (notes[selected].has(num)) notes[selected].delete(num);
            else notes[selected].add(num);
          }
          renderBoard();
          return;
        }

        board[selected] = num;
        if (num !== 0) {
          notes[selected].clear();
          clearPeerNotes(selected, num);
        }
        renderBoard();
        checkWin();
      });
    });

    container.querySelector("#sudokuNewBtn").addEventListener("click", showIdle);
    container.querySelector("#sudokuNotesToggle").addEventListener("click", () => {
      sudokuNotesMode = !sudokuNotesMode;
      renderBoard();
    });
    container.querySelector("#sudokuHintBtn").addEventListener("click", useHint);
    container.querySelector("#sudokuOverlayNewBtn").addEventListener("click", showIdle);
  }

  function useHint() {
    if (!running || hints <= 0) return;
    let idx = selected !== null && board[selected] === 0 ? selected : board.findIndex((v) => v === 0);
    if (idx === -1) return;
    board[idx] = solution[idx];
    notes[idx].clear();
    clearPeerNotes(idx, solution[idx]);
    hints -= 1;
    selected = idx;
    renderBoard();
    checkWin();
  }

  function checkWin() {
    if (!board.every((v) => v !== 0) || sudokuFindConflicts(board).size > 0) return;
    running = false;
    clearInterval(timerInterval);
    const best = bestTimes[settings.difficulty];
    let isNewBest = false;
    if (best === null || elapsed < best) {
      bestTimes[settings.difficulty] = elapsed;
      saveSudokuBestTimes(bestTimes);
      isNewBest = true;
    }
    const overlay = container.querySelector("#sudokuOverlay");
    container.querySelector("#sudokuOverlayTitle").textContent = "🎉 เก่งมาก!";
    container.querySelector("#sudokuOverlaySub").textContent = `เวลา ${sudokuFormatTime(elapsed)}${isNewBest ? " — สถิติใหม่!" : ""}`;
    overlay.classList.add("show");
  }

  showIdle();
}
