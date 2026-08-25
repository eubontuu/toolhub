// Chwazi (วางนิ้วพร้อมกัน สุ่มคนโดน) — no dependency on other tool files

function renderChwaziGame(body, state) {
  body.innerHTML = `
    <div class="chwazi-wrap">
      <div class="chwazi-hint" id="chwaziHint">ให้ทุกคนวางนิ้วบนจอพร้อมกันแล้วอย่าเพิ่งยก</div>
      <div class="chwazi-area" id="chwaziArea"></div>
    </div>
  `;

  const area = body.querySelector("#chwaziArea");
  const hint = body.querySelector("#chwaziHint");
  const points = new Map();
  let countdownTimer = null;
  let winnerId = null;

  function setHint(text, hidden) {
    hint.textContent = text;
    hint.classList.toggle("hidden", !!hidden);
  }

  function resetIfEmpty() {
    if (points.size === 0) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
      winnerId = null;
      setHint("ให้ทุกคนวางนิ้วบนจอพร้อมกันแล้วอย่าเพิ่งยก", false);
    }
  }

  function pickWinner() {
    if (points.size === 0) return;
    const ids = [...points.keys()];
    winnerId = ids[Math.floor(Math.random() * ids.length)];
    points.forEach((p, id) => {
      p.el.classList.toggle("winner", id === winnerId);
      p.el.classList.toggle("loser", id !== winnerId);
    });
    setHint("โดนแล้ว! ยกนิ้วออกแล้ววางใหม่เพื่อเล่นรอบต่อไป", true);
  }

  function startCountdown() {
    clearTimeout(countdownTimer);
    if (winnerId) return;
    if (points.size < 2) {
      setHint(`รอเพื่อนอีก... (${points.size} นิ้ว)`, false);
      return;
    }
    setHint(`กำลังสุ่ม... (${points.size} นิ้ว)`, false);
    countdownTimer = setTimeout(pickWinner, 2000);
  }

  function addPoint(id, x, y) {
    const el = document.createElement("div");
    el.className = "chwazi-dot";
    el.style.left = x + "px";
    el.style.top = y + "px";
    area.appendChild(el);
    points.set(id, { el });
  }

  function movePoint(id, x, y) {
    const p = points.get(id);
    if (!p) return;
    p.el.style.left = x + "px";
    p.el.style.top = y + "px";
  }

  function removePoint(id) {
    const p = points.get(id);
    if (p) {
      p.el.remove();
      points.delete(id);
    }
    resetIfEmpty();
    if (points.size > 0 && !winnerId) startCountdown();
  }

  area.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    area.setPointerCapture(e.pointerId);
    if (winnerId) {
      points.forEach((p) => p.el.remove());
      points.clear();
      winnerId = null;
    }
    const rect = area.getBoundingClientRect();
    addPoint(e.pointerId, e.clientX - rect.left, e.clientY - rect.top);
    startCountdown();
  });

  area.addEventListener("pointermove", (e) => {
    if (!points.has(e.pointerId)) return;
    const rect = area.getBoundingClientRect();
    movePoint(e.pointerId, e.clientX - rect.left, e.clientY - rect.top);
  });

  area.addEventListener("pointerup", (e) => removePoint(e.pointerId));
  area.addEventListener("pointercancel", (e) => removePoint(e.pointerId));
}
