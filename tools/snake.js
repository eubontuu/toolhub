// งู — classic snake, full-screen app, registered in APPS in app.js

const SNAKE_HIGH_SCORE_KEY = "toolhub.snake.highScore";

function loadSnakeHighScore() {
  try {
    return parseInt(localStorage.getItem(SNAKE_HIGH_SCORE_KEY) || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

function saveSnakeHighScore(v) {
  try {
    localStorage.setItem(SNAKE_HIGH_SCORE_KEY, String(v));
  } catch (e) {}
}

function renderSnake(container) {
  const GRID = 15;
  const CELL = 20;
  let highScore = loadSnakeHighScore();

  container.innerHTML = `
    <div class="snake-body">
      <div class="snake-score-row">
        <span>คะแนน <b id="snakeScore">0</b></span>
        <span>สูงสุด <b id="snakeHighScore">${highScore}</b></span>
      </div>
      <div class="snake-board-wrap">
        <canvas class="snake-canvas" id="snakeCanvas" width="${GRID * CELL}" height="${GRID * CELL}"></canvas>
        <div class="snake-overlay" id="snakeOverlay">
          <div class="snake-overlay-title" id="snakeOverlayTitle">🐍 เกมงู</div>
          <div class="snake-overlay-sub" id="snakeOverlaySub">ปัดหรือกดปุ่มลูกศรเพื่อเดิน กินอาหารให้ยาว อย่าชนตัวเองหรือกำแพง</div>
          <button class="snake-start-btn" id="snakeStartBtn">เริ่มเกม</button>
        </div>
      </div>
      <div class="snake-dpad">
        <button class="snake-dpad-btn snake-dpad-up" id="snakeUp">▲</button>
        <button class="snake-dpad-btn snake-dpad-left" id="snakeLeft">◀</button>
        <button class="snake-dpad-btn snake-dpad-down" id="snakeDown">▼</button>
        <button class="snake-dpad-btn snake-dpad-right" id="snakeRight">▶</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector("#snakeCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = container.querySelector("#snakeOverlay");
  const overlayTitle = container.querySelector("#snakeOverlayTitle");
  const overlaySub = container.querySelector("#snakeOverlaySub");
  const startBtn = container.querySelector("#snakeStartBtn");
  const scoreEl = container.querySelector("#snakeScore");
  const highScoreEl = container.querySelector("#snakeHighScore");

  const style = getComputedStyle(document.documentElement);
  const colorBg = style.getPropertyValue("--card").trim() || "#1b1f27";
  const colorFood = style.getPropertyValue("--red").trim() || "#ff453a";
  const colorSnake = style.getPropertyValue("--green").trim() || "#34c759";

  const TICK_MS_BASE = 160;
  let snake, dir, nextDir, food, score, running, timer;

  function randomFood() {
    let cell;
    do {
      cell = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some((s) => s.x === cell.x && s.y === cell.y));
    return cell;
  }

  function resetGame() {
    snake = [
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    food = randomFood();
    score = 0;
    scoreEl.textContent = "0";
  }

  function draw() {
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = colorFood;
    ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);

    snake.forEach((seg, i) => {
      ctx.globalAlpha = i === 0 ? 1 : 0.75;
      ctx.fillStyle = colorSnake;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.globalAlpha = 1;
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID;
    const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) {
      endGame();
      return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = String(score);
      food = randomFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function loop() {
    tick();
    if (!running) return;
    const speed = Math.max(70, TICK_MS_BASE - Math.floor(score / 30) * 10);
    timer = setTimeout(loop, speed);
  }

  function startGame() {
    resetGame();
    running = true;
    overlay.style.display = "none";
    draw();
    loop();
  }

  function endGame() {
    running = false;
    clearTimeout(timer);
    if (score > highScore) {
      highScore = score;
      saveSnakeHighScore(highScore);
      highScoreEl.textContent = String(highScore);
    }
    overlayTitle.textContent = "😵 จบเกม";
    overlaySub.textContent = `ได้ ${score} คะแนน — กดเพื่อเล่นใหม่`;
    startBtn.textContent = "เล่นอีกครั้ง";
    overlay.style.display = "flex";
  }

  function setDir(x, y) {
    if (!running) return;
    if (dir.x === -x && dir.y === -y) return;
    nextDir = { x, y };
  }

  startBtn.addEventListener("click", startGame);
  container.querySelector("#snakeUp").addEventListener("click", () => setDir(0, -1));
  container.querySelector("#snakeDown").addEventListener("click", () => setDir(0, 1));
  container.querySelector("#snakeLeft").addEventListener("click", () => setDir(-1, 0));
  container.querySelector("#snakeRight").addEventListener("click", () => setDir(1, 0));

  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true }
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
      else setDir(0, dy > 0 ? 1 : -1);
    },
    { passive: true }
  );

  resetGame();
  draw();
}
