// หวย — full-screen app (renderHuay, registered in APPS in app.js). สุ่มเลขหวย เลือกจำนวน
// หลักได้ (2/3/6 ตัว). แยกออกมาจากวงเหล้าเป็นแอปเดี่ยวแล้ว — เคยเป็นแถบในนั้นมาก่อน (ดู
// migration ใน loadHuayState ด้านล่าง สำหรับข้อมูลเก่าที่ยังอยู่ใน toolhub.wonglao).

const HUAY_DIGIT_OPTIONS = [
  { n: 2, label: "2 ตัวท้าย" },
  { n: 3, label: "3 ตัวท้าย" },
  { n: 6, label: "6 ตัว (เต็ม)" },
];

// สถิติเลขท้ายที่รายงานข่าวสาธารณะรวบรวมไว้ (~15-20 ปีย้อนหลัง ณ ที่มาแต่ละแหล่ง) — ไม่ใช่ข้อมูล
// ทางการ อาจไม่อัปเดตล่าสุด และ "ออกบ่อยในอดีต" ไม่มีผลต่อการออกงวดถัดไปเลย (แต่ละงวดสุ่มอิสระ)
// เก็บไว้แค่ให้ดูเล่นๆ ใน showHuayStatsOverlay — ดู disclaimer ในนั้นด้วย
const HUAY_STATS_2DIGIT = [
  { num: "79", count: 9, note: "แชมป์ตลอดกาลในหลายช่วงสถิติ" },
  { num: "85", count: 8, note: "บางแหล่งรายงานสูงถึง 11 ครั้งในช่วง 20 ปี" },
  { num: "69", count: 9, note: "อันดับ 2 ในช่วงสถิติ 20 ปี" },
  { num: "98", count: 7 },
  { num: "05", count: 7 },
  { num: "26", count: 7 },
  { num: "81", count: 7 },
  { num: "83" },
  { num: "95" },
  { num: "17" },
  { num: "25" },
  { num: "73" },
  { num: "89" },
  { num: "94" },
];

const HUAY_STATS_3DIGIT = [
  { num: "375", count: 5, note: "แชมป์เลขท้าย 3 ตัว" },
  { num: "578", count: 3 },
  { num: "989", count: 3 },
  { num: "631", count: 3 },
  { num: "297", count: 3 },
  { num: "094", count: 3 },
  { num: "421", count: 3 },
  { num: "426", count: 3 },
  { num: "447", count: 3 },
  { num: "485", count: 3 },
];

function loadHuayState() {
  try {
    const raw = localStorage.getItem("toolhub.huay");
    if (raw) {
      const state = JSON.parse(raw);
      if (typeof state.digits !== "number") state.digits = 6;
      if (typeof state.last !== "string") state.last = null;
      return state;
    }
    // one-time migration: หวย used to be a sub-game inside toolhub.wonglao before this split
    const oldRaw = localStorage.getItem("toolhub.wonglao");
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      if (old.huayDigits || old.huayLast) {
        return { digits: old.huayDigits || 6, last: old.huayLast || null };
      }
    }
  } catch (e) {}
  return { digits: 6, last: null };
}

function saveHuayState(state) {
  localStorage.setItem("toolhub.huay", JSON.stringify(state));
}

function huayRandomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function huayBallsHtml(digits, lastDigits) {
  return Array.from({ length: digits })
    .map(
      (_, i) => `
    <div class="huay-ball ${lastDigits ? "" : "placeholder"}">
      <span>${lastDigits ? lastDigits[i] : "?"}</span>
    </div>`
    )
    .join("");
}

function renderHuay(container) {
  const state = loadHuayState();

  function draw() {
    const digits = state.digits || 6;
    const lastDigits = state.last && state.last.length === digits ? state.last.split("") : null;

    container.innerHTML = `
      <div class="huay-wrap">
        <div class="huay-display-row" id="huayDisplay">${huayBallsHtml(digits, lastDigits)}</div>
        <div class="step-row">
          <div class="step-label">เลือกจำนวนหลัก</div>
          ${HUAY_DIGIT_OPTIONS.map(
            (o) => `<button class="step-chip ${digits === o.n ? "active" : ""}" data-digits="${o.n}">${o.label}</button>`
          ).join("")}
        </div>
        <button class="huay-action-btn" id="huayDrawBtn">สุ่มใหม่</button>
        <button class="reset-btn" id="huayStatsBtn">📊 ดูสถิติย้อนหลัง</button>
      </div>
    `;

    container.querySelector("#huayStatsBtn").addEventListener("click", () => {
      showHuayStatsOverlay();
    });

    container.querySelectorAll(".step-chip[data-digits]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.digits = Number(chip.dataset.digits);
        saveHuayState(state);
        draw();
      });
    });

    container.querySelector("#huayDrawBtn").addEventListener("click", () => {
      const finalVal = huayRandomDigits(digits);
      const balls = [...container.querySelectorAll(".huay-ball")];
      balls.forEach((b) => {
        b.classList.remove("placeholder", "settled");
      });
      const stopTicks = balls.map((_, i) => 14 + i * 3);
      const maxTicks = Math.max(...stopTicks);
      let ticks = 0;
      const spin = setInterval(() => {
        balls.forEach((ball, i) => {
          const span = ball.querySelector("span");
          if (ticks < stopTicks[i]) {
            span.textContent = Math.floor(Math.random() * 10);
          } else if (ticks === stopTicks[i]) {
            span.textContent = finalVal[i];
            ball.classList.add("settled");
          }
        });
        ticks++;
        if (ticks > maxTicks) {
          clearInterval(spin);
          state.last = finalVal;
          saveHuayState(state);
          showHuayOverlay(finalVal);
        }
      }, 70);
    });
  }

  draw();
}

function showHuayOverlay(value) {
  const overlay = document.createElement("div");
  overlay.className = "huay-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="huay-overlay-row">${value
      .split("")
      .map((d) => `<div class="huay-overlay-ball"><span>${d}</span></div>`)
      .join("")}</div>
    <div class="huay-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}

function huayStatsChipHtml(item) {
  return `
    <div class="huay-stats-chip">
      <span class="huay-stats-num">${item.num}</span>
      ${item.count ? `<span class="huay-stats-count">${item.count} ครั้ง</span>` : ""}
      ${item.note ? `<span class="huay-stats-note">${item.note}</span>` : ""}
    </div>`;
}

function showHuayStatsOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "huay-stats-overlay";
  overlay.innerHTML = `
    <div class="huay-stats-header">
      <button class="back-btn" id="huayStatsClose">‹</button>
      <div class="huay-stats-title">สถิติหวยในอดีต</div>
    </div>
    <div class="huay-stats-body">
      <div class="huay-stats-disclaimer">
        ข้อมูลรวบรวมจากรายงานข่าวสาธารณะ (ประมาณ 15-20 ปีย้อนหลัง แล้วแต่แหล่งข้อมูล) ไม่ใช่ข้อมูลทางการ และอาจไม่อัปเดตล่าสุด
        <strong>สถิติในอดีตไม่มีผลต่อการออกงวดถัดไปเลย</strong> แต่ละงวดสุ่มเป็นอิสระจากกันเสมอ (การสุ่มในแอปนี้ก็เช่นกัน) — ดูไว้เพื่อความสนุกเท่านั้น
      </div>
      <div class="huay-stats-section-title">เลขท้าย 2 ตัว ที่มีสถิติออกบ่อย</div>
      <div class="huay-stats-grid">${HUAY_STATS_2DIGIT.map(huayStatsChipHtml).join("")}</div>
      <div class="huay-stats-section-title">เลขท้าย 3 ตัว ที่มีสถิติออกบ่อย</div>
      <div class="huay-stats-grid">${HUAY_STATS_3DIGIT.map(huayStatsChipHtml).join("")}</div>
      <div class="huay-stats-source">ที่มา: รวบรวมจากรายงานข่าวหลายสำนัก (Thairath, Sanook, Postjung และอื่นๆ)</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector("#huayStatsClose").addEventListener("click", () => overlay.remove());
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
