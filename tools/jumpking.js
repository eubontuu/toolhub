// Jump King — full-screen app, registered in APPS in app.js
// charge-and-release jump: hold ◀/▶ to aim, hold jump button to charge power, release to launch

const JUMPKING_HIGH_SCORE_KEY = "toolhub.jumpking.highScore";

function loadJumpKingHighScore() {
  try {
    return parseInt(localStorage.getItem(JUMPKING_HIGH_SCORE_KEY) || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

function saveJumpKingHighScore(v) {
  try {
    localStorage.setItem(JUMPKING_HIGH_SCORE_KEY, String(v));
  } catch (e) {}
}

function renderJumpKing(container) {
  const CANVAS_W = 300;
  const CANVAS_H = 440;
  const PLAYER_SIZE = 16;
  const GRAVITY = 0.32;
  const JUMP_VY_WEAK = -6.5;
  const JUMP_VY_STRONG = -12.5;
  const CHARGE_MS = 900;
  const HORIZONTAL_MAX = 4.3;
  const PLATFORM_H = 10;
  const LEVEL_GAP_MIN = 48;
  const LEVEL_GAP_MAX = 88;
  const PLATFORM_W_MIN = 58;
  const PLATFORM_W_MAX = 96;
  const HORIZONTAL_JITTER = 95;
  const FALL_RESET_THRESHOLD = 260;
  const GROUND_CAM_MAX = -(CANVAS_H - 70);

  let highScore = loadJumpKingHighScore();

  container.innerHTML = `
    <div class="jk-body">
      <div class="jk-score-row">
        <span>คะแนน <b id="jkScore">0</b></span>
        <span>สูงสุด <b id="jkHighScore">${highScore}</b></span>
      </div>
      <div class="jk-power-track"><div class="jk-power-fill" id="jkPowerFill"></div></div>
      <div class="jk-board-wrap">
        <canvas class="jk-canvas" id="jkCanvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
        <div class="jk-overlay" id="jkOverlay">
          <div class="jk-overlay-title">🤴 Jump King</div>
          <div class="jk-overlay-sub">กดปุ่ม ◀/▶ ค้างไว้เพื่อเล็งทิศทาง แล้วกดปุ่มกระโดดค้างไว้สะสมพลัง ปล่อยเพื่อกระโดดขึ้นไปให้สูงที่สุด</div>
          <button class="jk-start-btn" id="jkStartBtn">เริ่มเกม</button>
        </div>
      </div>
      <div class="jk-controls">
        <button class="jk-ctrl-btn" id="jkLeft">◀</button>
        <button class="jk-jump-btn" id="jkJump">กระโดด</button>
        <button class="jk-ctrl-btn" id="jkRight">▶</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector("#jkCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = container.querySelector("#jkOverlay");
  const startBtn = container.querySelector("#jkStartBtn");
  const scoreEl = container.querySelector("#jkScore");
  const highScoreEl = container.querySelector("#jkHighScore");
  const powerFill = container.querySelector("#jkPowerFill");
  const leftBtn = container.querySelector("#jkLeft");
  const rightBtn = container.querySelector("#jkRight");
  const jumpBtn = container.querySelector("#jkJump");

  const style = getComputedStyle(document.documentElement);
  const colorBg = style.getPropertyValue("--card").trim() || "#1b1f27";
  const colorGround = style.getPropertyValue("--card-hi").trim() || "#262b35";
  const colorPlayer = style.getPropertyValue("--accent").trim() || "#4c8dff";

  let platforms, player, camY, checkpoint, bestWorldY;
  let leftHeld, rightHeld, charging, chargeStart, running, rafId, lastTime;

  function genNextPlatform(prev) {
    const gap = LEVEL_GAP_MIN + Math.random() * (LEVEL_GAP_MAX - LEVEL_GAP_MIN);
    const y = prev.y - gap;
    const w = PLATFORM_W_MIN + Math.random() * (PLATFORM_W_MAX - PLATFORM_W_MIN);
    const prevCenter = prev.x + prev.w / 2;
    let x = prevCenter - w / 2 + (Math.random() * 2 - 1) * HORIZONTAL_JITTER;
    x = Math.max(4, Math.min(CANVAS_W - w - 4, x));
    return { y, x, w };
  }

  function ensurePlatformsAbove(targetY) {
    let last = platforms[platforms.length - 1];
    while (last.y > targetY) {
      last = genNextPlatform(last);
      platforms.push(last);
    }
  }

  function resetGame() {
    platforms = [{ y: 0, x: 0, w: CANVAS_W }];
    ensurePlatformsAbove(-CANVAS_H * 1.5);
    player = { x: CANVAS_W / 2 - PLAYER_SIZE / 2, worldY: 0, vx: 0, vy: 0, onGround: true };
    checkpoint = { y: 0, x: CANVAS_W / 2 };
    bestWorldY = 0;
    camY = GROUND_CAM_MAX;
    leftHeld = false;
    rightHeld = false;
    charging = false;
    running = false;
    lastTime = 0;
    scoreEl.textContent = "0";
    powerFill.style.width = "0%";
  }

  function draw() {
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    platforms.forEach((p) => {
      const sy = p.y - camY;
      if (sy < -PLATFORM_H - 20 || sy > CANVAS_H + 20) return;
      ctx.fillStyle = colorGround;
      ctx.fillRect(p.x, sy, p.w, PLATFORM_H);
    });

    const psy = player.worldY - PLAYER_SIZE - camY;
    ctx.fillStyle = colorPlayer;
    ctx.fillRect(player.x, psy, PLAYER_SIZE, PLAYER_SIZE);
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("♛", player.x + PLAYER_SIZE / 2, psy - 2);
  }

  function frame(now) {
    if (!canvas.isConnected) {
      running = false;
      return;
    }
    if (!lastTime) lastTime = now;
    const dt = Math.min(2, (now - lastTime) / 16.6667);
    lastTime = now;

    if (charging) {
      const power = Math.min(1, (now - chargeStart) / CHARGE_MS);
      powerFill.style.width = (power * 100).toFixed(0) + "%";
    }

    if (!player.onGround) {
      player.vy += GRAVITY * dt;
      const prevY = player.worldY;
      player.worldY += player.vy * dt;
      player.x += player.vx * dt;
      if (player.x < 0) {
        player.x = 0;
        player.vx = 0;
      }
      if (player.x > CANVAS_W - PLAYER_SIZE) {
        player.x = CANVAS_W - PLAYER_SIZE;
        player.vx = 0;
      }

      if (player.vy > 0) {
        for (const p of platforms) {
          if (
            prevY <= p.y &&
            player.worldY >= p.y &&
            player.x + PLAYER_SIZE > p.x &&
            player.x < p.x + p.w
          ) {
            player.worldY = p.y;
            player.vx = 0;
            player.vy = 0;
            player.onGround = true;
            if (p.y < checkpoint.y) checkpoint = { y: p.y, x: p.x + p.w / 2 };
            break;
          }
        }
      }

      if (player.worldY - checkpoint.y > FALL_RESET_THRESHOLD) {
        player.worldY = checkpoint.y;
        player.x = checkpoint.x - PLAYER_SIZE / 2;
        player.vx = 0;
        player.vy = 0;
        player.onGround = true;
      }

      if (player.worldY < bestWorldY) {
        bestWorldY = player.worldY;
        const score = Math.round(-bestWorldY / 6);
        scoreEl.textContent = String(score);
        if (score > highScore) {
          highScore = score;
          saveJumpKingHighScore(highScore);
          highScoreEl.textContent = String(highScore);
        }
      }
    }

    const targetCam = player.worldY - CANVAS_H * 0.55;
    const eased = camY + (targetCam - camY) * 0.12 * Math.min(1, dt);
    camY = Math.min(eased, GROUND_CAM_MAX);

    ensurePlatformsAbove(camY - 150);

    draw();
    rafId = requestAnimationFrame(frame);
  }

  function startCharge() {
    if (!running || !player.onGround || charging) return;
    charging = true;
    chargeStart = performance.now();
  }

  function releaseCharge() {
    if (!charging) return;
    charging = false;
    const power = Math.min(1, (performance.now() - chargeStart) / CHARGE_MS);
    powerFill.style.width = "0%";
    let dir = 0;
    if (leftHeld && !rightHeld) dir = -1;
    else if (rightHeld && !leftHeld) dir = 1;
    player.vy = JUMP_VY_WEAK + (JUMP_VY_STRONG - JUMP_VY_WEAK) * power;
    player.vx = dir * HORIZONTAL_MAX * power;
    player.onGround = false;
  }

  function setLeft(v) {
    leftHeld = v;
    leftBtn.classList.toggle("active", v);
  }
  function setRight(v) {
    rightHeld = v;
    rightBtn.classList.toggle("active", v);
  }

  leftBtn.addEventListener("pointerdown", () => setLeft(true));
  leftBtn.addEventListener("pointerup", () => setLeft(false));
  leftBtn.addEventListener("pointerleave", () => setLeft(false));
  leftBtn.addEventListener("pointercancel", () => setLeft(false));

  rightBtn.addEventListener("pointerdown", () => setRight(true));
  rightBtn.addEventListener("pointerup", () => setRight(false));
  rightBtn.addEventListener("pointerleave", () => setRight(false));
  rightBtn.addEventListener("pointercancel", () => setRight(false));

  jumpBtn.addEventListener("pointerdown", startCharge);
  jumpBtn.addEventListener("pointerup", releaseCharge);
  jumpBtn.addEventListener("pointerleave", releaseCharge);
  jumpBtn.addEventListener("pointercancel", releaseCharge);

  startBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  });

  resetGame();
  draw();
}
