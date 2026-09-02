// Jump King — full-screen app, registered in APPS in app.js
// charge-and-release jump: hold ◀/▶ to charge power in that direction, release to launch.
// Height is shown in meters (worldY px / JUMPKING_PX_PER_M). Past HAZARD_MIN_HEIGHT_M (250m):
// platforms may start generating as special types (fixed colors, not theme-adaptive — see
// Theme vars rule) — "ice" is slippery (landing doesn't zero vx, friction decays it while
// sliding), "lava" shows a 5s countdown while stood on then launches the player away with a
// strong knockback — and a random "wind" gust (15-20s, random direction) may start every
// ~8-15s of no-wind time, gently pushing the player sideways while airborne only.

const JUMPKING_HIGH_SCORE_KEY = "toolhub.jumpking.highScore";
const JUMPKING_COLOR_ICE = "#bfe6ff";
const JUMPKING_COLOR_LAVA = "#ff5a36";
const JUMPKING_PX_PER_M = 6;

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
  const GROUND_CAM_MAX = -(CANVAS_H - 70);
  const WALL_BOUNCE_DAMPING = 0.6;
  const ICE_FRICTION = 0.985;
  const LAVA_EXPLODE_MS = 5000;
  const LAVA_EXPLODE_VY = -15;
  const HAZARD_MIN_HEIGHT_M = 250;
  const WIND_GAP_MIN_MS = 8000;
  const WIND_GAP_MAX_MS = 15000;
  const WIND_DURATION_MIN_MS = 15000;
  const WIND_DURATION_MAX_MS = 20000;
  const WIND_FORCE = 0.025;

  let highScore = loadJumpKingHighScore();

  container.innerHTML = `
    <div class="jk-body">
      <div class="jk-score-row">
        <span>ความสูง <b id="jkScore">0</b> ม.</span>
        <span>สูงสุด <b id="jkHighScore">${highScore}</b> ม.</span>
      </div>
      <div class="jk-power-track"><div class="jk-power-fill" id="jkPowerFill"></div></div>
      <div class="jk-board-wrap">
        <canvas class="jk-canvas" id="jkCanvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
        <div class="jk-wind-badge" id="jkWindBadge"></div>
        <div class="jk-overlay" id="jkOverlay">
          <div class="jk-overlay-title">🤴 Jump King</div>
          <div class="jk-overlay-sub">กดปุ่ม ◀ หรือ ▶ ค้างไว้เพื่อสะสมพลัง แล้วปล่อยเพื่อกระโดดไปทางนั้นให้สูงที่สุด ชนกำแพงแรงๆ จะเด้งกลับด้วย ขึ้นสูงเกิน 250 ม. จะเริ่มเจอพื้นน้ำแข็งลื่น พื้นลาวาที่ระเบิดถ้ายืนเกิน 5 วิ และลมพัดเป็นระยะ</div>
          <button class="jk-start-btn" id="jkStartBtn">เริ่มเกม</button>
        </div>
      </div>
      <div class="jk-controls">
        <button class="jk-ctrl-btn" id="jkLeft">◀</button>
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
  const windBadge = container.querySelector("#jkWindBadge");
  const leftBtn = container.querySelector("#jkLeft");
  const rightBtn = container.querySelector("#jkRight");

  const style = getComputedStyle(document.documentElement);
  const colorBg = style.getPropertyValue("--card").trim() || "#1b1f27";
  const colorGround = style.getPropertyValue("--card-hi").trim() || "#262b35";
  const colorPlayer = style.getPropertyValue("--accent").trim() || "#4c8dff";

  let platforms, player, camY, bestWorldY, standingPlatform, lavaTimerStart, lavaCountdown;
  let charging, chargeDir, chargeStart, running, rafId, lastTime;
  let windActive, windDir, windUntil, nextWindAt;

  function updateWindBadge() {
    if (windActive) {
      windBadge.textContent = `🌬️ ลมพัด ${windDir < 0 ? "◀" : "▶"}`;
      windBadge.classList.add("show");
    } else {
      windBadge.classList.remove("show");
    }
  }

  function updateWind(now, dt, heightM) {
    if (heightM <= HAZARD_MIN_HEIGHT_M) return;
    if (!windActive && nextWindAt === null) {
      nextWindAt = now + WIND_GAP_MIN_MS + Math.random() * (WIND_GAP_MAX_MS - WIND_GAP_MIN_MS);
    }
    if (!windActive && nextWindAt !== null && now >= nextWindAt) {
      windActive = true;
      windDir = Math.random() < 0.5 ? -1 : 1;
      windUntil = now + (WIND_DURATION_MIN_MS + Math.random() * (WIND_DURATION_MAX_MS - WIND_DURATION_MIN_MS));
      updateWindBadge();
    }
    if (windActive) {
      if (now >= windUntil) {
        windActive = false;
        nextWindAt = now + WIND_GAP_MIN_MS + Math.random() * (WIND_GAP_MAX_MS - WIND_GAP_MIN_MS);
        updateWindBadge();
      } else if (!player.onGround) {
        player.vx += windDir * WIND_FORCE * dt;
      }
    }
  }

  function pickPlatformType() {
    const r = Math.random();
    if (r < 0.1) return "lava";
    if (r < 0.25) return "ice";
    return "normal";
  }

  function genNextPlatform(prev) {
    const gap = LEVEL_GAP_MIN + Math.random() * (LEVEL_GAP_MAX - LEVEL_GAP_MIN);
    const y = prev.y - gap;
    const w = PLATFORM_W_MIN + Math.random() * (PLATFORM_W_MAX - PLATFORM_W_MIN);
    const prevCenter = prev.x + prev.w / 2;
    let x = prevCenter - w / 2 + (Math.random() * 2 - 1) * HORIZONTAL_JITTER;
    x = Math.max(4, Math.min(CANVAS_W - w - 4, x));
    const heightM = Math.round(-y / JUMPKING_PX_PER_M);
    const type = platforms.length < 3 || heightM < HAZARD_MIN_HEIGHT_M ? "normal" : pickPlatformType();
    return { y, x, w, type };
  }

  function ensurePlatformsAbove(targetY) {
    let last = platforms[platforms.length - 1];
    while (last.y > targetY) {
      last = genNextPlatform(last);
      platforms.push(last);
    }
  }

  function resetGame() {
    platforms = [{ y: 0, x: 0, w: CANVAS_W, type: "normal" }];
    ensurePlatformsAbove(-CANVAS_H * 1.5);
    player = { x: CANVAS_W / 2 - PLAYER_SIZE / 2, worldY: 0, vx: 0, vy: 0, onGround: true };
    standingPlatform = platforms[0];
    lavaTimerStart = null;
    lavaCountdown = null;
    bestWorldY = 0;
    camY = GROUND_CAM_MAX;
    charging = false;
    chargeDir = 0;
    running = false;
    lastTime = 0;
    windActive = false;
    windDir = 0;
    windUntil = 0;
    nextWindAt = null;
    updateWindBadge();
    scoreEl.textContent = "0";
    powerFill.style.width = "0%";
  }

  function draw() {
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    platforms.forEach((p) => {
      const sy = p.y - camY;
      if (sy < -PLATFORM_H - 20 || sy > CANVAS_H + 20) return;
      ctx.fillStyle = p.type === "ice" ? JUMPKING_COLOR_ICE : p.type === "lava" ? JUMPKING_COLOR_LAVA : colorGround;
      ctx.fillRect(p.x, sy, p.w, PLATFORM_H);

      if (p.type === "lava" && p === standingPlatform && lavaCountdown !== null) {
        ctx.strokeStyle = "#ff2d2d";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x - 1, sy - 1, p.w + 2, PLATFORM_H + 2);
        ctx.fillStyle = "#ff2d2d";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(lavaCountdown), p.x + p.w / 2, sy - 4);
      }
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
        if (player.vx < 0) player.vx = -player.vx * WALL_BOUNCE_DAMPING;
      }
      if (player.x > CANVAS_W - PLAYER_SIZE) {
        player.x = CANVAS_W - PLAYER_SIZE;
        if (player.vx > 0) player.vx = -player.vx * WALL_BOUNCE_DAMPING;
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
            player.vy = 0;
            if (p.type !== "ice") player.vx = 0;
            player.onGround = true;
            standingPlatform = p;
            lavaTimerStart = null;
            lavaCountdown = null;
            break;
          }
        }
      }

      if (player.worldY < bestWorldY) {
        bestWorldY = player.worldY;
        const heightM = Math.round(-bestWorldY / JUMPKING_PX_PER_M);
        scoreEl.textContent = String(heightM);
        if (heightM > highScore) {
          highScore = heightM;
          saveJumpKingHighScore(highScore);
          highScoreEl.textContent = String(highScore);
        }
      }
    } else if (standingPlatform) {
      if (standingPlatform.type === "ice" && player.vx !== 0) {
        player.x += player.vx * dt;
        player.vx *= Math.pow(ICE_FRICTION, dt);
        if (Math.abs(player.vx) < 0.05) player.vx = 0;
        if (player.x < 0) {
          player.x = 0;
          player.vx = 0;
        }
        if (player.x > CANVAS_W - PLAYER_SIZE) {
          player.x = CANVAS_W - PLAYER_SIZE;
          player.vx = 0;
        }
        const stillOn = player.x + PLAYER_SIZE > standingPlatform.x && player.x < standingPlatform.x + standingPlatform.w;
        if (!stillOn) {
          player.onGround = false;
          standingPlatform = null;
        }
      }

      if (standingPlatform && standingPlatform.type === "lava") {
        if (lavaTimerStart === null) lavaTimerStart = now;
        const elapsed = now - lavaTimerStart;
        lavaCountdown = Math.max(0, 5 - Math.floor(elapsed / 1000));
        if (elapsed >= LAVA_EXPLODE_MS) explodeLava();
      } else {
        lavaTimerStart = null;
        lavaCountdown = null;
      }
    }

    updateWind(now, dt, Math.round(-bestWorldY / JUMPKING_PX_PER_M));

    const targetCam = player.worldY - CANVAS_H * 0.55;
    const eased = camY + (targetCam - camY) * 0.12 * Math.min(1, dt);
    camY = Math.min(eased, GROUND_CAM_MAX);

    ensurePlatformsAbove(camY - 150);

    draw();
    rafId = requestAnimationFrame(frame);
  }

  function explodeLava() {
    const center = standingPlatform.x + standingPlatform.w / 2;
    const dir = player.x + PLAYER_SIZE / 2 < center ? -1 : 1;
    player.vy = LAVA_EXPLODE_VY;
    player.vx = dir * (HORIZONTAL_MAX * 1.6 + Math.random() * HORIZONTAL_MAX * 0.8);
    player.onGround = false;
    standingPlatform = null;
    lavaTimerStart = null;
    lavaCountdown = null;
  }

  function startCharge(dir, btn) {
    if (!running || !player.onGround || charging) return;
    charging = true;
    chargeDir = dir;
    chargeStart = performance.now();
    btn.classList.add("active");
  }

  function releaseCharge(dir, btn) {
    if (!charging || chargeDir !== dir) return;
    charging = false;
    btn.classList.remove("active");
    const power = Math.min(1, (performance.now() - chargeStart) / CHARGE_MS);
    powerFill.style.width = "0%";
    player.vy = JUMP_VY_WEAK + (JUMP_VY_STRONG - JUMP_VY_WEAK) * power;
    player.vx = dir * HORIZONTAL_MAX * power;
    player.onGround = false;
  }

  // preventDefault on pointerdown stops iOS Safari from starting its long-press
  // text-selection gesture on these buttons (holding to charge a jump otherwise
  // triggers the native "select" callout/loupe mid-hold).
  leftBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    startCharge(-1, leftBtn);
  });
  leftBtn.addEventListener("pointerup", () => releaseCharge(-1, leftBtn));
  leftBtn.addEventListener("pointerleave", () => releaseCharge(-1, leftBtn));
  leftBtn.addEventListener("pointercancel", () => releaseCharge(-1, leftBtn));

  rightBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    startCharge(1, rightBtn);
  });
  rightBtn.addEventListener("pointerup", () => releaseCharge(1, rightBtn));
  rightBtn.addEventListener("pointerleave", () => releaseCharge(1, rightBtn));
  rightBtn.addEventListener("pointercancel", () => releaseCharge(1, rightBtn));

  startBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  });

  resetGame();
  draw();
}
