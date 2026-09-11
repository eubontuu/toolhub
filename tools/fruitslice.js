// ฟันผลไม้ — fruit-slicing game (Fruit Ninja-style): drag across the canvas to slice fruit
// launched upward under gravity. Slicing a bomb ends the game instantly; letting too many
// fruits fall uncut also ends it. Consecutive slices inside one continuous drag stroke chain
// into a combo for bonus score. Canvas + closured-state + RAF-loop pattern mirrors jumpking.js.

const FRUITSLICE_HIGH_SCORE_KEY = "toolhub.fruitslice.highScore";
const FRUITSLICE_EMOJIS = ["🍉", "🍊", "🍎", "🍇", "🍌", "🍓", "🍍", "🥝"];
const FRUITSLICE_MAX_MISSES = 3;

function loadFruitSliceHighScore() {
  try {
    return parseInt(localStorage.getItem(FRUITSLICE_HIGH_SCORE_KEY) || "0", 10) || 0;
  } catch (e) {
    return 0;
  }
}

function saveFruitSliceHighScore(v) {
  try {
    localStorage.setItem(FRUITSLICE_HIGH_SCORE_KEY, String(v));
  } catch (e) {}
}

function renderFruitSlice(container) {
  const CANVAS_W = 300;
  const CANVAS_H = 440;
  const GRAVITY = 0.22;
  const RADIUS = 22;
  const BOMB_RADIUS = 20;
  const SLICE_PAD = 8;
  const SPAWN_MS_START = 1100;
  const SPAWN_MS_MIN = 480;
  const SPAWN_RAMP_SCORE = 400;
  const BOMB_CHANCE_START = 0.05;
  const BOMB_CHANCE_MAX = 0.2;
  const BOMB_CHANCE_RAMP_SCORE = 600;
  const COMBO_WINDOW_MS = 500;
  const TRAIL_MAX_AGE_MS = 200;
  const TRAIL_MAX_POINTS = 14;

  let highScore = loadFruitSliceHighScore();

  container.innerHTML = `
    <div class="fs-body">
      <div class="fs-score-row">
        <span>คะแนน <b id="fsScore">0</b></span>
        <span>พลาด <b id="fsMisses">0</b>/${FRUITSLICE_MAX_MISSES}</span>
        <span>สูงสุด <b id="fsHighScore">${highScore}</b></span>
      </div>
      <div class="fs-board-wrap">
        <canvas class="fs-canvas" id="fsCanvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
        <div class="fs-combo-badge" id="fsComboBadge"></div>
        <div class="fs-overlay" id="fsOverlay">
          <div class="fs-overlay-title">🍉 ฟันผลไม้</div>
          <div class="fs-overlay-sub">ลากนิ้วฟันผลไม้ที่ลอยขึ้นมาให้ได้คะแนน ฟันติดกันรัวๆ ได้คอมโบ ห้ามฟันระเบิด 💣 เด็ดขาด และอย่าปล่อยผลไม้ร่วงพื้นเกิน ${FRUITSLICE_MAX_MISSES} ลูก</div>
          <button class="fs-start-btn" id="fsStartBtn">เริ่มเกม</button>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector("#fsCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = container.querySelector("#fsOverlay");
  const scoreEl = container.querySelector("#fsScore");
  const missesEl = container.querySelector("#fsMisses");
  const highScoreEl = container.querySelector("#fsHighScore");
  const comboBadge = container.querySelector("#fsComboBadge");

  const style = getComputedStyle(document.documentElement);
  const colorBg = style.getPropertyValue("--card").trim() || "#1b1f27";

  let objects, trail, score, misses, running, rafId, lastTime, nextSpawnAt, comboCount, comboUntil;

  function resetGame() {
    objects = [];
    trail = [];
    score = 0;
    misses = 0;
    running = false;
    lastTime = 0;
    nextSpawnAt = 0;
    comboCount = 0;
    comboUntil = 0;
    scoreEl.textContent = "0";
    missesEl.textContent = "0";
    comboBadge.classList.remove("show");
  }

  function bombChance() {
    const t = Math.min(1, score / BOMB_CHANCE_RAMP_SCORE);
    return BOMB_CHANCE_START + (BOMB_CHANCE_MAX - BOMB_CHANCE_START) * t;
  }

  function spawnInterval() {
    const t = Math.min(1, score / SPAWN_RAMP_SCORE);
    return SPAWN_MS_START + (SPAWN_MS_MIN - SPAWN_MS_START) * t;
  }

  function spawnObject(now) {
    const isBomb = Math.random() < bombChance();
    const x = RADIUS + 10 + Math.random() * (CANVAS_W - (RADIUS + 10) * 2);
    const vy = -(9.5 + Math.random() * 2.2);
    const vx = (Math.random() * 2 - 1) * 1.6;
    objects.push({
      x,
      y: CANVAS_H + RADIUS,
      vx,
      vy,
      rot: 0,
      rotSpeed: (Math.random() * 2 - 1) * 0.08,
      radius: isBomb ? BOMB_RADIUS : RADIUS,
      isBomb,
      emoji: isBomb ? "💣" : FRUITSLICE_EMOJIS[Math.floor(Math.random() * FRUITSLICE_EMOJIS.length)],
      sliced: false,
      missed: false,
    });
    nextSpawnAt = now + spawnInterval();
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  function registerCombo(now) {
    if (now < comboUntil) {
      comboCount++;
    } else {
      comboCount = 1;
    }
    comboUntil = now + COMBO_WINDOW_MS;
    if (comboCount >= 2) {
      comboBadge.textContent = `คอมโบ x${comboCount}!`;
      comboBadge.classList.add("show");
    }
  }

  function sliceFruit(obj, now) {
    obj.sliced = true;
    registerCombo(now);
    const bonus = comboCount >= 2 ? comboCount * 5 : 0;
    score += 10 + bonus;
    scoreEl.textContent = String(score);
  }

  function endGame() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (score > highScore) {
      highScore = score;
      saveFruitSliceHighScore(highScore);
      highScoreEl.textContent = String(highScore);
    }
    overlay.innerHTML = `
      <div class="fs-overlay-title">จบเกม!</div>
      <div class="fs-overlay-sub">คะแนน ${score} — สูงสุด ${highScore}</div>
      <button class="fs-start-btn" id="fsRetryBtn">เล่นใหม่</button>
    `;
    overlay.style.display = "flex";
    overlay.querySelector("#fsRetryBtn").addEventListener("click", startGame);
  }

  function checkTrailSlices(now) {
    if (trail.length < 2) return;
    const p1 = trail[trail.length - 2];
    const p2 = trail[trail.length - 1];
    for (const obj of objects) {
      if (obj.sliced || obj.missed) continue;
      const d = distToSegment(obj.x, obj.y, p1.x, p1.y, p2.x, p2.y);
      if (d <= obj.radius + SLICE_PAD) {
        if (obj.isBomb) {
          obj.sliced = true;
          drawFrame();
          endGame();
          return;
        }
        sliceFruit(obj, now);
      }
    }
  }

  function drawFrame() {
    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    objects.forEach((obj) => {
      if (obj.missed) return;
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rot);
      ctx.globalAlpha = obj.sliced ? 0.35 : 1;
      ctx.font = `${obj.radius * 1.9}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.emoji, 0, 0);
      ctx.restore();
    });

    if (trail.length > 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }
  }

  function frame(now) {
    if (!canvas.isConnected) {
      running = false;
      return;
    }
    if (!lastTime) lastTime = now;
    const dt = Math.min(2, (now - lastTime) / 16.6667);
    lastTime = now;

    trail = trail.filter((p) => now - p.t <= TRAIL_MAX_AGE_MS);
    if (now > comboUntil && comboBadge.classList.contains("show")) {
      comboBadge.classList.remove("show");
    }

    if (now >= nextSpawnAt) spawnObject(now);

    objects.forEach((obj) => {
      if (obj.sliced || obj.missed) return;
      obj.vy += GRAVITY * dt;
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;
      obj.rot += obj.rotSpeed * dt;
      if (obj.y - obj.radius > CANVAS_H) {
        obj.missed = true;
        if (!obj.isBomb) {
          misses++;
          missesEl.textContent = String(misses);
        }
      }
    });

    objects = objects.filter((obj) => obj.y - obj.radius <= CANVAS_H + 60);

    if (misses >= FRUITSLICE_MAX_MISSES) {
      drawFrame();
      endGame();
      return;
    }

    drawFrame();
    rafId = requestAnimationFrame(frame);
  }

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  let dragging = false;

  canvas.addEventListener("pointerdown", (e) => {
    if (!running) return;
    e.preventDefault();
    dragging = true;
    const pos = canvasPos(e);
    trail = [{ x: pos.x, y: pos.y, t: performance.now() }];
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!running || !dragging) return;
    e.preventDefault();
    const pos = canvasPos(e);
    trail.push({ x: pos.x, y: pos.y, t: performance.now() });
    if (trail.length > TRAIL_MAX_POINTS) trail.shift();
    checkTrailSlices(performance.now());
  });

  function stopDrag() {
    dragging = false;
  }
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointerleave", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);

  function startGame() {
    resetGame();
    running = true;
    nextSpawnAt = performance.now() + 300;
    overlay.style.display = "none";
    rafId = requestAnimationFrame(frame);
  }

  container.querySelector("#fsStartBtn").addEventListener("click", startGame);

  resetGame();
  drawFrame();
}
