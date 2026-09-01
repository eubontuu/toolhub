// ดูดวง — full-screen app (renderFortune, registered in APPS in app.js). แตะลูกแก้วเพื่อสุ่มคำทำนาย
// จาก FORTUNE_DATA ทีละใบ โชว์รายละเอียดการงาน/การเงิน/ความรัก/สุขภาพ + เลขมงคล/สีมงคล บันทึกใบล่าสุดไว้ดูซ้ำได้

const FORTUNE_DATA = [
  { id: 1, stars: 5, title: "ดวงเปิดทุกด้าน โชคดีมาเต็มพิกัด", work: "ได้รับความไว้วางใจให้ทำสิ่งสำคัญ ทำเต็มที่แล้วจะเปล่งประกาย", money: "มีลาภลอยเข้ามาโดยไม่คาดคิด", love: "คนที่คิดถึงจะทักมาเอง", health: "แข็งแรงดี พลังงานล้นเหลือ", luckyNumber: "09", luckyColor: { name: "ทอง", hex: "#d4af37" } },
  { id: 2, stars: 4, title: "ก้าวไปข้างหน้าอย่างมั่นใจ ผลลัพธ์จะคุ้มค่า", work: "แผนที่วางไว้เริ่มเห็นผล อย่าเพิ่งท้อ", money: "การเงินมั่นคง แต่อย่าลืมเก็บออม", love: "ความสัมพันธ์กำลังไปได้สวย", health: "พักผ่อนให้พอ ร่างกายจะตอบแทนดี", luckyNumber: "15", luckyColor: { name: "เขียว", hex: "#43a047" } },
  { id: 3, stars: 3, title: "เรื่องทั่วไปราบรื่นดี ไม่มีอะไรให้กังวลมาก", work: "ทำงานตามปกติ ไม่มีอุปสรรคใหญ่", money: "รายรับรายจ่ายสมดุลดี", love: "ความสัมพันธ์นิ่งๆ อบอุ่นแบบเรียบง่าย", health: "ปกติดี ควรออกกำลังกายเพิ่ม", luckyNumber: "27", luckyColor: { name: "ฟ้า", hex: "#29b6f6" } },
  { id: 4, stars: 5, title: "โชคเข้าข้าง สิ่งที่รอคอยกำลังจะมาถึง", work: "ข่าวดีกำลังจะมา เตรียมตัวรับไว้", money: "โอกาสทำเงินก้อนใหม่เปิดออก", love: "คนโสดมีเกณฑ์เจอคนถูกใจ", health: "สดชื่นแจ่มใส", luckyNumber: "03", luckyColor: { name: "แดง", hex: "#e53935" } },
  { id: 5, stars: 2, title: "ช่วงนี้ควรใจเย็นและรอบคอบเป็นพิเศษ", work: "อย่าตัดสินใจเรื่องใหญ่ด่วนเกินไป", money: "ระวังรายจ่ายไม่จำเป็น", love: "มีเรื่องเข้าใจผิดเล็กน้อย พูดคุยกันให้ชัด", health: "พักผ่อนไม่พอ ควรนอนให้เป็นเวลา", luckyNumber: "41", luckyColor: { name: "เทา", hex: "#78909c" } },
  { id: 6, stars: 4, title: "ความพยายามที่ผ่านมาเริ่มออกดอกผล", work: "สิ่งที่ทำมานานเริ่มมีคนเห็นค่า", money: "มีโอกาสได้โบนัสหรือรายได้พิเศษ", love: "คนรอบข้างเข้าใจและซัพพอร์ตดี", health: "ร่างกายฟื้นตัวได้ดี", luckyNumber: "18", luckyColor: { name: "ส้ม", hex: "#fb8c00" } },
  { id: 7, stars: 3, title: "ทุกอย่างเป็นไปตามจังหวะของมันเอง", work: "อดทนอีกนิด ผลงานจะค่อยๆ ชัดเจน", money: "การเงินทรงตัว ไม่มีอะไรผันผวน", love: "ความสัมพันธ์ต้องใช้เวลาประคอง", health: "ควรดื่มน้ำให้มากขึ้น", luckyNumber: "33", luckyColor: { name: "ม่วง", hex: "#8e24aa" } },
  { id: 8, stars: 4, title: "มีคนคอยช่วยเหลืออยู่เบื้องหลังโดยไม่รู้ตัว", work: "จะมีคนยื่นมือช่วยในจังหวะที่ต้องการพอดี", money: "มีลุ้นเรื่องเงินคืนหรือส่วนลดก้อนโต", love: "คนใกล้ตัวอาจกลายเป็นคนพิเศษ", health: "ร่างกายแข็งแรงกว่าที่คิด", luckyNumber: "22", luckyColor: { name: "ชมพู", hex: "#ec407a" } },
  { id: 9, stars: 1, title: "ช่วงนี้ควรตั้งสติและระวังเป็นพิเศษ อย่าฝืน", work: "หลีกเลี่ยงการทะเลาะหรือขัดแย้งกับคนในที่ทำงาน", money: "ระวังการลงทุนหรือให้ยืมเงินก้อนใหญ่", love: "อาจมีความเข้าใจผิด ควรใจเย็นๆ", health: "ดูแลตัวเองให้ดี อย่าหักโหม", luckyNumber: "49", luckyColor: { name: "น้ำเงิน", hex: "#3949ab" } },
  { id: 10, stars: 5, title: "ดวงพุ่งแรง เป็นช่วงที่ควรลงมือทำสิ่งที่ตั้งใจไว้", work: "ไอเดียที่คิดไว้นานควรเริ่มลงมือได้แล้ว", money: "จังหวะดีสำหรับการเริ่มต้นสิ่งใหม่", love: "ความรักหวานชื่น มีเซอร์ไพรส์รออยู่", health: "พลังงานเต็มเปี่ยม", luckyNumber: "07", luckyColor: { name: "ทอง", hex: "#d4af37" } },
  { id: 11, stars: 3, title: "เรื่องเล็กๆ น้อยๆ อาจทำให้กังวลใจ แต่ไม่ใช่เรื่องใหญ่", work: "มีงานจุกจิกเข้ามาบ้าง จัดลำดับความสำคัญให้ดี", money: "ควรทำบัญชีรายรับรายจ่ายให้ชัดเจน", love: "คุยกันตรงๆ จะช่วยคลี่คลายทุกอย่าง", health: "ปวดเมื่อยเล็กน้อย ควรยืดเส้นยืดสาย", luckyNumber: "36", luckyColor: { name: "น้ำตาล", hex: "#6d4c41" } },
  { id: 12, stars: 4, title: "สิ่งที่หวังไว้มีโอกาสเป็นจริงถ้าไม่ท้อ", work: "โปรเจกต์ที่ทำอยู่มีแนวโน้มไปได้สวย", money: "การเงินดีขึ้นกว่าช่วงก่อนหน้า", love: "คนโสดมีโอกาสได้พบเจอคนใหม่", health: "หากออกกำลังกายสม่ำเสมอจะเห็นผลชัด", luckyNumber: "12", luckyColor: { name: "เขียว", hex: "#43a047" } },
  { id: 13, stars: 2, title: "ควรรอบคอบเรื่องคำพูดและการตัดสินใจ", work: "คำพูดที่ไม่ทันคิดอาจสร้างปัญหา", money: "ยังไม่ใช่จังหวะที่ดีสำหรับการลงทุนใหญ่", love: "อย่าเก็บความรู้สึกไว้คนเดียว พูดออกมาบ้าง", health: "ระวังเรื่องกระเพาะและการพักผ่อน", luckyNumber: "44", luckyColor: { name: "เทา", hex: "#78909c" } },
  { id: 14, stars: 5, title: "ทุกความตั้งใจกำลังเดินทางมาบรรจบกัน", work: "ผลงานที่ทำจะได้รับคำชมอย่างที่ไม่คาดคิด", money: "มีเกณฑ์ได้รับเงินก้อนจากแหล่งที่ไม่คาดคิด", love: "ความสัมพันธ์แน่นแฟ้นขึ้นอีกขั้น", health: "สุขภาพกายและใจแข็งแรงพร้อมลุย", luckyNumber: "01", luckyColor: { name: "แดง", hex: "#e53935" } },
  { id: 15, stars: 3, title: "ช่วงนี้เหมาะกับการทบทวนมากกว่าการเร่งรีบ", work: "ลองทบทวนแผนเดิมดูอีกครั้งก่อนลุยต่อ", money: "การเงินเสถียร ไม่มีอะไรน่าห่วง", love: "ใช้เวลาร่วมกันเงียบๆ จะทำให้ใจฟูขึ้น", health: "ควรหาเวลาพักผ่อนแบบไม่มีจอ", luckyNumber: "30", luckyColor: { name: "ฟ้า", hex: "#29b6f6" } },
  { id: 16, stars: 4, title: "มีข่าวดีรอคุณอยู่ไม่ไกลจากตอนนี้", work: "การติดต่อหรือข้อเสนอใหม่ๆ กำลังจะเข้ามา", money: "รายได้เสริมมีลุ้นเข้ามาแบบไม่คาดฝัน", love: "คนที่ห่างหายอาจกลับมาติดต่อ", health: "ร่างกายกระปรี้กระเปร่าขึ้น", luckyNumber: "19", luckyColor: { name: "ส้ม", hex: "#fb8c00" } },
  { id: 17, stars: 1, title: "เป็นช่วงพักตัว ควรตั้งหลักก่อนเดินหน้าต่อ", work: "อย่าเพิ่งตัดสินใจเปลี่ยนแปลงใหญ่ในตอนนี้", money: "เก็บออมไว้ก่อน อย่าเพิ่งใช้จ่ายฟุ่มเฟือย", love: "ให้เวลาตัวเองและอีกฝ่ายสักพัก", health: "ร่างกายส่งสัญญาณเตือน ควรตรวจเช็กสุขภาพ", luckyNumber: "48", luckyColor: { name: "น้ำเงิน", hex: "#3949ab" } },
  { id: 18, stars: 5, title: "เส้นทางข้างหน้าสดใส เดินหน้าได้เต็มที่", work: "เป็นช่วงที่เหมาะกับการขอเลื่อนตำแหน่งหรือขึ้นเงินเดือน", money: "โชคด้านการเงินแรงเป็นพิเศษ", love: "มีโอกาสได้ยินคำสารภาพหรือคำขอที่รอคอย", health: "แข็งแรงสมบูรณ์ตลอดช่วงนี้", luckyNumber: "05", luckyColor: { name: "ทอง", hex: "#d4af37" } },
  { id: 19, stars: 3, title: "ทุกอย่างเดินไปตามครรลองของมัน ใจเย็นไว้", work: "งานที่ทำเสร็จแล้วอาจต้องรอผลตอบรับสักพัก", money: "ยังไม่มีการเปลี่ยนแปลงใหญ่ ใช้จ่ายตามปกติได้", love: "ความสัมพันธ์มั่นคงดีในแบบของมันเอง", health: "ออกกำลังกายเบาๆ จะช่วยให้สดชื่นขึ้น", luckyNumber: "25", luckyColor: { name: "ม่วง", hex: "#8e24aa" } },
  { id: 20, stars: 4, title: "ประตูโอกาสกำลังจะเปิดออกให้เดินเข้าไป", work: "โอกาสใหม่ในหน้าที่การงานกำลังจะมาถึง", money: "การลงทุนที่วางแผนไว้ดีมีเกณฑ์ได้ผลตอบแทนดี", love: "คนโสดมีเสน่ห์ดึงดูดเป็นพิเศษช่วงนี้", health: "พลังงานดี เหมาะกับการเริ่มกิจกรรมใหม่", luckyNumber: "16", luckyColor: { name: "ชมพู", hex: "#ec407a" } },
];

function loadFortuneState() {
  try {
    const raw = localStorage.getItem("toolhub.fortune");
    if (raw) {
      const state = JSON.parse(raw);
      if (typeof state.lastId === "number" && FORTUNE_DATA.some((f) => f.id === state.lastId)) return state;
    }
  } catch (e) {}
  return { lastId: null };
}

function saveFortuneState(state) {
  localStorage.setItem("toolhub.fortune", JSON.stringify(state));
}

function fortuneStarsHtml(stars) {
  return Array.from({ length: 5 }, (_, i) => `<span class="fortune-star ${i < stars ? "filled" : ""}">★</span>`).join("");
}

function fortuneCardHtml(f) {
  return `
    <div class="fortune-card-id">คำทำนายใบที่ ${f.id}</div>
    <div class="fortune-card-stars">${fortuneStarsHtml(f.stars)}</div>
    <div class="fortune-card-title">${f.title}</div>
    <div class="fortune-card-rows">
      <div class="fortune-card-row"><span class="fortune-card-label">การงาน</span><span>${f.work}</span></div>
      <div class="fortune-card-row"><span class="fortune-card-label">การเงิน</span><span>${f.money}</span></div>
      <div class="fortune-card-row"><span class="fortune-card-label">ความรัก</span><span>${f.love}</span></div>
      <div class="fortune-card-row"><span class="fortune-card-label">สุขภาพ</span><span>${f.health}</span></div>
    </div>
    <div class="fortune-card-footer">
      <div class="fortune-lucky"><span class="fortune-lucky-label">เลขมงคล</span><span class="fortune-lucky-value">${f.luckyNumber}</span></div>
      <div class="fortune-lucky"><span class="fortune-lucky-label">สีมงคล</span><span class="fortune-color-swatch" style="background:${f.luckyColor.hex}"></span><span class="fortune-lucky-value">${f.luckyColor.name}</span></div>
    </div>
  `;
}

function renderFortune(container) {
  const state = loadFortuneState();

  function draw() {
    const last = state.lastId !== null ? FORTUNE_DATA.find((f) => f.id === state.lastId) : null;
    container.innerHTML = `
      <div class="fortune-wrap">
        <button class="fortune-orb-btn" id="fortuneOrbBtn" aria-label="ดูดวง">
          <span class="fortune-orb-icon">🔮</span>
        </button>
        <div class="fortune-hint">แตะลูกแก้วเพื่อดูดวง</div>
        ${
          last
            ? `<button class="fortune-last-card" id="fortuneLastCard">
                <div class="fortune-last-label">ผลล่าสุดของคุณ</div>
                <div class="fortune-last-row">
                  <span class="fortune-last-id">ใบที่ ${last.id}</span>
                  <span class="fortune-last-stars">${fortuneStarsHtml(last.stars)}</span>
                </div>
                <div class="fortune-last-title">${last.title}</div>
              </button>`
            : ""
        }
      </div>
    `;

    container.querySelector("#fortuneOrbBtn").addEventListener("click", reveal);

    const lastCard = container.querySelector("#fortuneLastCard");
    if (lastCard) lastCard.addEventListener("click", () => showFortuneOverlay(last, reveal));
  }

  function reveal() {
    const orb = container.querySelector("#fortuneOrbBtn");
    if (!orb || orb.classList.contains("glowing")) return;
    orb.classList.add("glowing");
    setTimeout(() => {
      const candidates = FORTUNE_DATA.filter((f) => f.id !== state.lastId);
      const pool = candidates.length ? candidates : FORTUNE_DATA;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      state.lastId = picked.id;
      saveFortuneState(state);
      draw();
      showFortuneOverlay(picked, reveal);
    }, 700);
  }

  draw();
}

function showFortuneOverlay(f, onRevealAgain) {
  const overlay = document.createElement("div");
  overlay.className = "fortune-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="fortune-overlay-card">${fortuneCardHtml(f)}</div>
    <button class="fortune-overlay-next-btn" id="fortuneOverlayNextBtn">ดูดวงอีกครั้ง</button>
    <div class="fortune-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".fortune-overlay-card").addEventListener("click", (e) => e.stopPropagation());
  overlay.querySelector("#fortuneOverlayNextBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    overlay.remove();
    onRevealAgain();
  });
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
