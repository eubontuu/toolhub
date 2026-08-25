// เตรียมเดินป่า — no dependency on other tool files

const HIKE_TRIP_DATE = "2026-10-01";

const HIKE_DAYS = [
  { d: "2026-08-24", dow: "จันทร์", wk: 1, type: "strength", title: "Strength พื้นฐาน", detail: "สควอท 2x18, ลันจ์ 2x15/ขา, กลูทบริดจ์ 2x20, แพลงก์ 2x40วิ + ยืดเหยียด 10 นาที" },
  { d: "2026-08-25", dow: "อังคาร", wk: 1, type: "cardio", title: "Cardio เบาๆ", detail: "เดินเร็ว/จ็อกเบาๆ 30 นาที (คุยได้ระหว่างเดินแต่หอบเล็กน้อย)" },
  { d: "2026-08-26", dow: "พุธ", wk: 1, type: "cardio", title: "Leg Conditioning Circuit", detail: "จัมป์สควอท 2x15, วอล์กกิ้งลันจ์ 2x18/ขา, เขย่งปลายเท้า 2x30, high knees 2 รอบ x45วิ (พื้นราบ)" },
  { d: "2026-08-27", dow: "พฤหัสบดี", wk: 1, type: "rest", title: "พักฟื้นแบบ Active", detail: "ยืดเหยียด/โยคะเบาๆ 15-20 นาที" },
  { d: "2026-08-28", dow: "ศุกร์", wk: 1, type: "cardio", title: "Cardio เบาๆ", detail: "เดินเร็ว 30 นาที" },
  { d: "2026-08-29", dow: "เสาร์", wk: 1, type: "strength", title: "Strength รอบ 2", detail: "ทำซ้ำท่าเมื่อวันจันทร์ + เพิ่ม core: bicycle crunch 2x30, side plank 2x30วิ/ข้าง" },
  { d: "2026-08-30", dow: "อาทิตย์", wk: 1, type: "rest", title: "พักผ่อน", detail: "พักผ่อนเต็มที่ หรือเดินเบาๆ 20 นาที" },
  { d: "2026-08-31", dow: "จันทร์", wk: 2, type: "strength", title: "Strength เพิ่มความหนัก", detail: "สควอท 2x22, ลันจ์ 2x18/ขา, กลูทบริดจ์ 2x25, แพลงก์ 2x50วิ" },
  { d: "2026-09-01", dow: "อังคาร", wk: 2, type: "cardio", title: "Cardio", detail: "เดินเร็ว/จ็อกเบาๆ 40 นาที" },
  { d: "2026-09-02", dow: "พุธ", wk: 2, type: "cardio", title: "Leg Conditioning Circuit", detail: "จัมป์สควอท 2x18, วอล์กกิ้งลันจ์ 2x20/ขา, เขย่งปลายเท้า 2x35, high knees 2 รอบ x50วิ (พื้นราบ)" },
  { d: "2026-09-03", dow: "พฤหัสบดี", wk: 2, type: "rest", title: "พักฟื้นแบบ Active", detail: "ยืดเหยียด/โยคะเบาๆ 15-20 นาที" },
  { d: "2026-09-04", dow: "ศุกร์", wk: 2, type: "cardio", title: "Cardio", detail: "เดินเร็ว/จ็อกเบาๆ 40 นาที" },
  { d: "2026-09-05", dow: "เสาร์", wk: 2, type: "strength", title: "Strength รอบ 2", detail: "ทำซ้ำท่าเมื่อวันจันทร์ (สควอท 2x22, ลันจ์ 2x18/ขา, กลูทบริดจ์ 2x25, แพลงก์ 2x50วิ) + core: bicycle crunch 2x35, side plank 2x35วิ/ข้าง" },
  { d: "2026-09-06", dow: "อาทิตย์", wk: 2, type: "rest", title: "พักผ่อน", detail: "พักผ่อนเต็มที่ หรือเดินเบาๆ 20 นาที" },
  { d: "2026-09-07", dow: "จันทร์", wk: 3, type: "strength", title: "Strength ขั้นสูง", detail: "Split squat (มือจับเก้าอี้พยุงตัว) 2x15/ขา, จัมป์ลันจ์สลับขา 2x15/ขา, wall sit 2x45วิ, แพลงก์ 2x60วิ" },
  { d: "2026-09-08", dow: "อังคาร", wk: 3, type: "cardio", title: "Cardio", detail: "เดินเร็ว/ปั่นจักรยาน/ว่ายน้ำ 40-50 นาที (เลือกตามที่สะดวก)" },
  { d: "2026-09-09", dow: "พุธ", wk: 3, type: "ruck", title: "สะพายเป้พื้นราบ", detail: "เดินเร็วสะพายเป้ ใส่น้ำหนัก (ขวดน้ำ/หนังสือ) 3-5 กก. บนพื้นราบ 20-30 นาที สลับเร่งจังหวะ 2 นาที/พัก 1 นาที เพื่อชดเชยไม่มีทางลาดชัน" },
  { d: "2026-09-10", dow: "พฤหัสบดี", wk: 3, type: "rest", title: "พัก", detail: "พัก/ยืดเหยียด" },
  { d: "2026-09-11", dow: "ศุกร์", wk: 3, type: "cardio", title: "Cardio", detail: "40-50 นาที" },
  { d: "2026-09-12", dow: "เสาร์", wk: 3, type: "trail", title: "เดินไกลสะพายเป้ (พื้นราบ)", detail: "เดินเร็วสะพายเป้เบาๆ บนพื้นราบ 5-8 กม." },
  { d: "2026-09-13", dow: "อาทิตย์", wk: 3, type: "rest", title: "พักผ่อน", detail: "พักผ่อน + ยืดเหยียด" },
  { d: "2026-09-14", dow: "จันทร์", wk: 4, type: "strength", title: "Strength เพิ่มระดับ", detail: "Split squat 2x18/ขา, จัมป์ลันจ์สลับขา 2x18/ขา, wall sit 2x50วิ, แพลงก์ 2x65วิ" },
  { d: "2026-09-15", dow: "อังคาร", wk: 4, type: "cardio", title: "Cardio", detail: "40-50 นาที" },
  { d: "2026-09-16", dow: "พุธ", wk: 4, type: "ruck", title: "สะพายเป้พื้นราบ", detail: "เดินเร็วสะพายเป้ 5-7 กก. บนพื้นราบ 30-35 นาที สลับเร่งจังหวะ 2 นาที/พัก 1 นาที" },
  { d: "2026-09-17", dow: "พฤหัสบดี", wk: 4, type: "rest", title: "พัก", detail: "พัก/ยืดเหยียด" },
  { d: "2026-09-18", dow: "ศุกร์", wk: 4, type: "cardio", title: "Cardio", detail: "40-50 นาที" },
  { d: "2026-09-19", dow: "เสาร์", wk: 4, type: "trail", title: "เดินไกลสะพายเป้ (พื้นราบ)", detail: "เดินเร็วสะพายเป้ บนพื้นราบ 8-10 กม." },
  { d: "2026-09-20", dow: "อาทิตย์", wk: 4, type: "rest", title: "พักผ่อน", detail: "พักผ่อน + ยืดเหยียด" },
  { d: "2026-09-21", dow: "จันทร์", wk: 5, type: "strength", title: "Strength คงสภาพ", detail: "Split squat 2x15/ขา, จัมป์ลันจ์สลับขา 2x15/ขา, wall sit 2x45วิ, แพลงก์ 2x55วิ (ลดลงเล็กน้อยเก็บแรงไว้ก่อนวันจำลองสถานการณ์เสาร์นี้)" },
  { d: "2026-09-22", dow: "อังคาร", wk: 5, type: "cardio", title: "Cardio เบาๆ", detail: "เบาๆ 30 นาที" },
  { d: "2026-09-23", dow: "พุธ", wk: 5, type: "ruck", title: "สะพายเป้เต็มน้ำหนัก (พื้นราบ)", detail: "เดินเร็วสะพายเป้หนักใกล้เคียงทริปจริง บนพื้นราบ 30 นาที เร่งจังหวะเต็มที่ช่วง 10 นาทีสุดท้าย" },
  { d: "2026-09-24", dow: "พฤหัสบดี", wk: 5, type: "rest", title: "พัก", detail: "พักเต็มที่" },
  { d: "2026-09-25", dow: "ศุกร์", wk: 5, type: "cardio", title: "Cardio เบาๆ", detail: "เบาๆ 20-30 นาที" },
  { d: "2026-09-26", dow: "เสาร์", wk: 5, type: "trail", key: true, title: "จำลองสถานการณ์เต็มรูปแบบ", detail: "เดินไกลสะพายเป้หนักเท่าทริปจริง บนพื้นราบ 15-18 กม. (เพิ่มระยะชดเชยการไม่มีทางลาดชัน) — วันสำคัญที่สุดของโปรแกรม" },
  { d: "2026-09-27", dow: "อาทิตย์", wk: 5, type: "rest", title: "พักฟื้น", detail: "พักฟื้น + ยืดเหยียด" },
  { d: "2026-09-28", dow: "จันทร์", wk: 6, type: "taper", title: "Taper เบาๆ", detail: "ยืดเหยียดเบาๆ + strength เบามาก: split squat 2x10/ขา, wall sit 2x30วิ, แพลงก์ 2x40วิ" },
  { d: "2026-09-29", dow: "อังคาร", wk: 6, type: "taper", title: "เช็คอุปกรณ์", detail: "เดินเบาๆ 20 นาที + เช็ค/แพ็ครองเท้า เป้ อุปกรณ์ให้พร้อม" },
  { d: "2026-09-30", dow: "พุธ", wk: 6, type: "taper", title: "พักเต็มที่", detail: "พักเต็มที่ นอนให้พอ เตรียมของให้พร้อมก่อนออกเดินทาง" },
  { d: "2026-10-01", dow: "พฤหัสบดี", wk: 6, type: "trip", title: "วันเดินทาง", detail: "🎒 วันเดินทาง/เริ่มทริป — ขอให้สนุกและปลอดภัย!" },
];

const HIKE_TYPE_LABEL = { strength: "Strength", cardio: "Cardio", ruck: "สะพายเป้ (พื้นราบ)", trail: "เดินไกล (พื้นราบ)", rest: "พัก", taper: "Taper", trip: "ทริป" };
const HIKE_PHASE_BY_WEEK = {
  1: "สัปดาห์ 1-2 · สร้างพื้นฐาน",
  2: "สัปดาห์ 1-2 · สร้างพื้นฐาน",
  3: "สัปดาห์ 3-4 · เพิ่มความหนัก + สะพายเป้",
  4: "สัปดาห์ 3-4 · เพิ่มความหนัก + สะพายเป้",
  5: "สัปดาห์ 5 · จำลองสถานการณ์จริง",
  6: "สัปดาห์ 6 · ลดความหนัก (Taper)",
};
const HIKE_TIP_BY_TYPE = {
  strength: "ทำท่าให้ถูกฟอร์มดีกว่าทำเร็วแต่ท่าเพี้ยน",
  cardio: "รักษาจังหวะหายใจสม่ำเสมอ ไม่ต้องเร่งความเร็ว",
  ruck: "สะพายเป้ให้แนบลำตัว น้ำหนักอยู่ที่สะโพกไม่ใช่บ่า เร่งจังหวะเดินเพื่อชดเชยพื้นราบ",
  trail: "พกน้ำ ของว่าง และแจ้งเส้นทาง/เวลากลับให้คนที่บ้านทราบ",
  rest: "พักคือส่วนหนึ่งของการฝึก ร่างกายฟื้นตัวและแข็งแรงขึ้นตอนนี้",
  taper: "อย่าฝึกหนักช่วงนี้ เป้าหมายคือเก็บแรงไว้ให้เต็มที่",
  trip: "เดินจังหวะตัวเอง ดื่มน้ำสม่ำเสมอ ขอให้เที่ยวสนุก",
};

function hikeFmtThaiDate(dstr) {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const p = dstr.split("-");
  return `${parseInt(p[2], 10)} ${months[parseInt(p[1], 10) - 1]} ${parseInt(p[0], 10) + 543}`;
}

function hikeTodayStr() {
  const n = new Date();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${n.getFullYear()}-${m}-${d}`;
}

function hikeDaysBetween(a, b) {
  const A = new Date(`${a}T00:00:00`);
  const B = new Date(`${b}T00:00:00`);
  return Math.round((B - A) / 86400000);
}

function hikeGetDone(dstr) {
  try {
    return localStorage.getItem(`toolhub.hikeprep.${dstr}`) === "1";
  } catch (e) {
    return false;
  }
}

function hikeSetDone(dstr, val) {
  try {
    localStorage.setItem(`toolhub.hikeprep.${dstr}`, val ? "1" : "0");
  } catch (e) {}
}

function renderHikePrep(container) {
  container.innerHTML = `
    <div class="hike-wrap">
      <p class="hike-sub">แผน 6 สัปดาห์ ไม่ใช้อุปกรณ์ยิม ไม่มีบันได/เนิน · เริ่ม 24 ส.ค. — ทริป 1 ต.ค. 2026</p>

      <div class="hike-hero">
        <div class="hike-countdown">
          <div class="hike-countdown-num" id="hikeCountdownNum">—</div>
          <div class="hike-countdown-lbl" id="hikeCountdownLbl">วันก่อนทริป</div>
        </div>
        <div class="hike-hero-body">
          <span class="hike-hero-phase" id="hikeHeroPhase">กำลังโหลด…</span>
          <span class="hike-hero-date" id="hikeHeroDate"></span>
        </div>
      </div>

      <div class="hike-today-card" id="hikeTodayCard">
        <div class="hike-today-head">
          <span class="hike-today-label">วันนี้ต้องทำ</span>
          <span class="hike-badge" id="hikeTodayBadge"></span>
        </div>
        <div class="hike-today-title" id="hikeTodayTitle"></div>
        <div class="hike-today-detail" id="hikeTodayDetail"></div>
        <label class="hike-check-row" id="hikeTodayCheckRow" style="display:none">
          <input type="checkbox" id="hikeTodayCheck" />
          <span>ทำแล้ววันนี้</span>
        </label>
        <div class="hike-today-tip" id="hikeTodayTip"></div>
      </div>

      <div class="hike-progress-line">
        <span id="hikeProgressText">0/${HIKE_DAYS.length} วัน</span>
        <div class="hike-progress-track"><div class="hike-progress-fill" id="hikeProgressFill" style="width:0%"></div></div>
      </div>

      <div class="hike-plan-title">ตารางเต็ม 6 สัปดาห์</div>
      <div id="hikeWeeks"></div>

      <div class="hike-plan-title">Tips ก่อนและระหว่างทริป</div>
      <div class="hike-tip-grid">
        <div class="hike-tip-card"><span class="hike-tip-h">รองเท้า</span><p>ใส่รองเท้าเดินป่าคู่จริงซ้อมล่วงหน้าอย่างน้อย 2-3 สัปดาห์ ให้เท้าปรับตัวก่อนวันจริง</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">น้ำหนักเป้</span><p>ใช้เป้จริง + ขวดน้ำหรือหนังสือแทนดัมเบล เพิ่มน้ำหนักทีละน้อยไม่เกิน 10%/สัปดาห์</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">ป้องกันแผลพอง</span><p>แปะพลาสเตอร์จุดเสี่ยงก่อนเริ่มเดิน ไม่ต้องรอให้แผลเกิดก่อนค่อยแปะ</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">น้ำ &amp; เกลือแร่</span><p>จิบน้ำทีละน้อยบ่อยๆ ดีกว่ารอกระหายแล้วดื่มทีเดียวเยอะ พกเกลือแร่/ถั่วกันตะคริว</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">จังหวะการเดิน</span><p>เดินจังหวะสม่ำเสมอตามกำลังตัวเอง อย่าเร่งตามคนอื่นในช่วงแรกของเส้นทาง</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">การฟื้นฟู</span><p>นอนให้พอระหว่างซ้อม กล้ามเนื้อฟื้นตัวตอนนอนไม่ใช่ตอนออกกำลัง หากปวดข้อให้พัก อย่าฝืน</p></div>
        <div class="hike-tip-card"><span class="hike-tip-h">ไม่ได้ฝึกขึ้นเขามาก่อน</span><p>โปรแกรมนี้ฝึกบนพื้นราบทั้งหมด วันจริงตอนขึ้นเนิน/เขาอาจเหนื่อยกว่าที่ซ้อมมา ให้เดินช้าลงกว่าปกติช่วงขึ้นเขา พักบ่อยขึ้น และฟังจังหวะหัวใจตัวเองเป็นหลัก</p></div>
      </div>

      <div class="hike-footer">อัปเดตตนเองได้ทุกวัน · ข้อมูลเก็บไว้ในเครื่องนี้เท่านั้น</div>
    </div>
  `;

  function renderProgress() {
    let done = 0;
    HIKE_DAYS.forEach((d) => {
      if (hikeGetDone(d.d)) done++;
    });
    container.querySelector("#hikeProgressText").textContent = `${done}/${HIKE_DAYS.length} วัน`;
    container.querySelector("#hikeProgressFill").style.width = `${Math.round((done / HIKE_DAYS.length) * 100)}%`;
  }

  function renderWeeks() {
    const weeksEl = container.querySelector("#hikeWeeks");
    const today = hikeTodayStr();
    const byWeek = {};
    HIKE_DAYS.forEach((d) => {
      (byWeek[d.wk] = byWeek[d.wk] || []).push(d);
    });

    weeksEl.innerHTML = Object.keys(byWeek)
      .sort((a, b) => a - b)
      .map((wk) => {
        const containsToday = byWeek[wk].some((d) => d.d === today);
        const rows = byWeek[wk]
          .map((d) => {
            const done = hikeGetDone(d.d);
            return `
              <div class="hike-day-row ${done ? "done" : ""}">
                <span class="hike-day-check"><input type="checkbox" ${done ? "checked" : ""} data-date="${d.d}" /></span>
                <span class="hike-day-date">${d.d.slice(8, 10)}/${d.d.slice(5, 7)}<span class="hike-dow">${d.dow.slice(0, 3)}</span></span>
                <span class="hike-day-main"><div class="hike-day-title">${d.title}${d.key ? " ⭐" : ""}</div><div class="hike-day-text">${d.detail}</div></span>
                <span class="hike-badge ${d.type}">${HIKE_TYPE_LABEL[d.type]}</span>
              </div>
            `;
          })
          .join("");
        return `
          <details class="hike-week" ${containsToday ? "open" : ""}>
            <summary><span>สัปดาห์ ${wk}</span><span class="hike-week-phase">${HIKE_PHASE_BY_WEEK[wk]}</span><span class="hike-chev">›</span></summary>
            ${rows}
          </details>
        `;
      })
      .join("");

    weeksEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        hikeSetDone(cb.dataset.date, cb.checked);
        render();
      });
    });
  }

  function render() {
    const today = hikeTodayStr();
    const first = HIKE_DAYS[0].d;
    const cd = hikeDaysBetween(today, HIKE_TRIP_DATE);

    container.querySelector("#hikeCountdownNum").textContent = cd >= 0 ? cd : "ไป!";
    container.querySelector("#hikeCountdownLbl").textContent =
      cd > 0 ? "วันก่อนทริป" : cd === 0 ? "ออกเดินทางวันนี้" : "ระหว่างทริป/หลังทริป";
    container.querySelector("#hikeHeroDate").textContent = hikeFmtThaiDate(today);

    const entry = HIKE_DAYS.find((d) => d.d === today) || null;
    container.querySelector("#hikeHeroPhase").textContent = entry
      ? HIKE_PHASE_BY_WEEK[entry.wk]
      : today < first
      ? "ยังไม่เริ่มโปรแกรม"
      : "หลังทริป";

    const card = container.querySelector("#hikeTodayCard");
    const badge = container.querySelector("#hikeTodayBadge");
    const titleEl = container.querySelector("#hikeTodayTitle");
    const detailEl = container.querySelector("#hikeTodayDetail");
    const tipEl = container.querySelector("#hikeTodayTip");
    const checkRow = container.querySelector("#hikeTodayCheckRow");
    const checkbox = container.querySelector("#hikeTodayCheck");

    if (entry) {
      card.className = `hike-today-card ${entry.key ? "is-key" : ""}`;
      badge.className = `hike-badge ${entry.type}`;
      badge.textContent = HIKE_TYPE_LABEL[entry.type];
      titleEl.textContent = entry.title;
      detailEl.textContent = entry.detail;
      tipEl.textContent = `Tip: ${HIKE_TIP_BY_TYPE[entry.type]}`;
      checkRow.style.display = "flex";
      checkbox.checked = hikeGetDone(entry.d);
      checkbox.onchange = () => {
        hikeSetDone(entry.d, checkbox.checked);
        renderWeeks();
        renderProgress();
      };
    } else {
      badge.textContent = "";
      checkRow.style.display = "none";
      tipEl.textContent = "";
      if (today < first) {
        titleEl.textContent = "ยังไม่ถึงวันเริ่มโปรแกรม";
        detailEl.textContent = "โปรแกรมเริ่ม 24 ส.ค. 2026 — เตรียมรองเท้าและเป้ให้พร้อมระหว่างนี้";
      } else {
        titleEl.textContent = "ไปเดินป่าแล้ว! 🌲";
        detailEl.textContent = "ขอให้สนุกและปลอดภัยตลอดทริปนะ";
      }
    }

    renderWeeks();
    renderProgress();
  }

  render();
}
