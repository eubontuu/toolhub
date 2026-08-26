// Chwazi (วางนิ้วพร้อมกัน สุ่มคนโดน) — no dependency on other tool files

function renderChwaziGame(body, state) {
  const winnerCountOptions = [1, 2, 3];

  body.innerHTML = `
    <div class="chwazi-wrap">
      <div class="step-row">
        <div class="step-label">จำนวนคนที่โดน</div>
        ${winnerCountOptions
          .map(
            (n) =>
              `<button class="step-chip ${state.chwaziWinnerCount === n ? "active" : ""}" data-n="${n}">${n}</button>`
          )
          .join("")}
        <button class="step-chip ${winnerCountOptions.includes(state.chwaziWinnerCount) ? "" : "active"}" id="chwaziCustomCount">กำหนดเอง${
    winnerCountOptions.includes(state.chwaziWinnerCount) ? "" : ` (${state.chwaziWinnerCount})`
  }</button>
      </div>
      <div class="chwazi-hint" id="chwaziHint">ให้ทุกคนวางนิ้วบนจอพร้อมกันแล้วอย่าเพิ่งยก</div>
      <div class="chwazi-area" id="chwaziArea"></div>
    </div>
  `;

  body.querySelectorAll(".step-chip[data-n]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.chwaziWinnerCount = Number(chip.dataset.n);
      saveWongLaoState(state);
      renderChwaziGame(body, state);
    });
  });

  body.querySelector("#chwaziCustomCount").addEventListener("click", () => {
    const input = prompt("กำหนดจำนวนคนที่โดน", state.chwaziWinnerCount);
    if (input === null) return;
    const n = Number(input);
    if (!Number.isInteger(n) || n < 1) return;
    state.chwaziWinnerCount = n;
    saveWongLaoState(state);
    renderChwaziGame(body, state);
  });

  const area = body.querySelector("#chwaziArea");
  const hint = body.querySelector("#chwaziHint");
  const points = new Map();
  let countdownTimer = null;
  let roundDone = false;

  function setHint(text, hidden) {
    hint.textContent = text;
    hint.classList.toggle("hidden", !!hidden);
  }

  function resetIfEmpty() {
    if (points.size === 0) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
      roundDone = false;
      setHint("ให้ทุกคนวางนิ้วบนจอพร้อมกันแล้วอย่าเพิ่งยก", false);
    }
  }

  function pickWinner() {
    if (points.size === 0) return;
    const ids = shuffleArray([...points.keys()]);
    const winnerCount = Math.min(state.chwaziWinnerCount || 1, ids.length);
    const winnerIds = new Set(ids.slice(0, winnerCount));
    roundDone = true;
    points.forEach((p, id) => {
      p.el.classList.toggle("winner", winnerIds.has(id));
      p.el.classList.toggle("loser", !winnerIds.has(id));
    });
    setHint(
      winnerCount > 1 ? `โดนแล้ว ${winnerCount} คน! ยกนิ้วออกแล้ววางใหม่เพื่อเล่นรอบต่อไป` : "โดนแล้ว! ยกนิ้วออกแล้ววางใหม่เพื่อเล่นรอบต่อไป",
      true
    );
  }

  function startCountdown() {
    clearTimeout(countdownTimer);
    if (roundDone) return;
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
    if (points.size > 0 && !roundDone) startCountdown();
  }

  area.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    area.setPointerCapture(e.pointerId);
    if (roundDone) {
      points.forEach((p) => p.el.remove());
      points.clear();
      roundDone = false;
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
