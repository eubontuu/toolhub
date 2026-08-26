// เตรียมเดินป่า — Home-screen widget (renderHikePrep fills #hikeWidget, called from renderHome
// in app.js). Shows the accumulating backlog of past/today days not yet marked done — tap
// "เสร็จแล้ว" to clear a day off the list. No tap-through screen. No dependency on other tool files.

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

function hikeFmtThaiDate(dstr) {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const p = dstr.split("-");
  return `${parseInt(p[2], 10)} ${months[parseInt(p[1], 10) - 1]} ${parseInt(p[0], 10) + 543}`;
}

function hikeFmtShortDate(dstr) {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const p = dstr.split("-");
  return `${parseInt(p[2], 10)} ${months[parseInt(p[1], 10) - 1]}`;
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
  function draw() {
    const today = hikeTodayStr();
    const first = HIKE_DAYS[0].d;
    const cd = hikeDaysBetween(today, HIKE_TRIP_DATE);
    const countdownText = cd > 0 ? `เหลืออีก ${cd} วันก่อนทริป` : cd === 0 ? "ออกเดินทางวันนี้!" : "ทริปผ่านไปแล้ว";
    const backlog = HIKE_DAYS.filter((d) => d.d <= today && !hikeGetDone(d.d));

    container.innerHTML = `
      <div class="hike-widget-title">🥾 เตรียมเดินป่า</div>
      <div class="hike-widget-countdown">${countdownText}</div>
      <div class="hike-widget-list">
        ${
          today < first
            ? `<div class="hike-widget-empty">โปรแกรมเริ่ม ${hikeFmtThaiDate(first)}</div>`
            : backlog.length === 0
            ? `<div class="hike-widget-empty">ทำครบทุกวันแล้ว เยี่ยมมาก! 🎉</div>`
            : backlog
                .map((d) => {
                  const overdue = d.d < today;
                  return `
              <div class="hike-widget-item ${overdue ? "overdue" : ""}">
                <div class="hike-widget-item-body">
                  <span class="hike-widget-item-title">${d.title}${d.key ? " ⭐" : ""}</span>
                  <span class="hike-widget-item-meta">${hikeFmtShortDate(d.d)} (${d.dow.slice(0, 3)})${
                    overdue ? " · เลยกำหนดแล้ว" : " · วันนี้"
                  }</span>
                </div>
                <button class="hike-widget-done-btn" data-date="${d.d}">เสร็จแล้ว</button>
              </div>
            `;
                })
                .join("")
        }
      </div>
    `;

    container.querySelectorAll(".hike-widget-done-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        hikeSetDone(btn.dataset.date, true);
        draw();
      });
    });
  }

  draw();
}
