// ดูดวง — full-screen app (renderFortune, registered in APPS in app.js). Two modes:
// "ประจำวัน" (tap the orb for a random general reading, redrawable as many times as you
// like — never repeats the immediately-previous card) and "เฉพาะเรื่อง" (pick a topic, get
// a detailed reading just for it, also redrawable). FORTUNE_DATA (100 entries) is generated
// at load from small phrase pools (buildFortuneData) rather than hand-written one-by-one —
// pool sizes are pairwise-coprime-ish so all 100 ids get a distinct title/work/money/love/
// health combination (see buildFortuneData comment). After a reveal, the screen's background
// tints toward that card's lucky color over a fixed dark base (not theme-adaptive — see
// Theme vars rule; the mystical dark backdrop is the ดูดวง screen's own flavor).

const FORTUNE_TITLE_POOL = [
  "ช่วงนี้ควรตั้งสติและระวังเป็นพิเศษ",
  "เป็นช่วงพักตัว ควรตั้งหลักก่อนเดินหน้าต่อ",
  "ควรใจเย็นและรอบคอบเป็นพิเศษ",
  "ควรรอบคอบเรื่องคำพูดและการตัดสินใจ",
  "เรื่องทั่วไปราบรื่นดี ไม่มีอะไรน่ากังวลมาก",
  "ทุกอย่างเป็นไปตามจังหวะของมันเอง",
  "ความพยายามที่ผ่านมาเริ่มออกดอกผล",
  "มีข่าวดีรอคุณอยู่ไม่ไกลจากตอนนี้",
  "ดวงเปิดทุกด้าน โชคดีมาเต็มพิกัด",
  "ดวงพุ่งแรง เป็นช่วงที่ควรลงมือทำสิ่งที่ตั้งใจไว้",
];
const FORTUNE_WORK_POOL = [
  "ทำงานตามปกติ ไม่มีอุปสรรคใหญ่",
  "แผนที่วางไว้เริ่มเห็นผล อย่าเพิ่งท้อ",
  "งานจุกจิกเข้ามาบ้าง ควรจัดลำดับความสำคัญให้ดี",
  "สิ่งที่ทำมานานเริ่มมีคนเห็นค่า",
  "หลีกเลี่ยงการขัดแย้งกับคนในที่ทำงานช่วงนี้",
  "ไอเดียที่คิดไว้นานควรเริ่มลงมือได้แล้ว",
  "จะมีคนยื่นมือช่วยในจังหวะที่ต้องการพอดี",
  "ผลงานที่ทำจะได้รับคำชมอย่างที่ไม่คาดคิด",
  "การติดต่อหรือข้อเสนอใหม่ๆ กำลังจะเข้ามา",
];
const FORTUNE_MONEY_POOL = [
  "รายรับรายจ่ายสมดุลดี",
  "ระวังรายจ่ายไม่จำเป็นในช่วงนี้",
  "มีลาภลอยเข้ามาโดยไม่คาดคิด",
  "การเงินทรงตัว ไม่มีอะไรผันผวน",
  "มีโอกาสได้โบนัสหรือรายได้พิเศษ",
  "ยังไม่ใช่จังหวะที่ดีสำหรับการลงทุนก้อนใหญ่",
  "จังหวะดีสำหรับการเริ่มต้นสิ่งใหม่ด้านการเงิน",
  "เก็บออมไว้ก่อน อย่าเพิ่งใช้จ่ายฟุ่มเฟือย",
];
const FORTUNE_LOVE_POOL = [
  "ความสัมพันธ์นิ่งๆ อบอุ่นแบบเรียบง่าย",
  "อาจมีเรื่องเข้าใจผิดเล็กน้อย พูดคุยกันให้ชัด",
  "คนโสดมีเกณฑ์เจอคนถูกใจ",
  "คนรอบข้างเข้าใจและซัพพอร์ตดี",
  "คนใกล้ตัวอาจกลายเป็นคนพิเศษ",
  "ให้เวลาตัวเองและอีกฝ่ายสักพัก",
  "ความสัมพันธ์แน่นแฟ้นขึ้นอีกขั้น",
];
const FORTUNE_HEALTH_POOL = [
  "ปกติดี ควรออกกำลังกายเพิ่ม",
  "พักผ่อนไม่พอ ควรนอนให้เป็นเวลา",
  "ร่างกายฟื้นตัวได้ดี",
  "ควรดื่มน้ำให้มากขึ้น",
  "ร่างกายแข็งแรงกว่าที่คิด",
  "ดูแลตัวเองให้ดี อย่าหักโหม",
  "พลังงานเต็มเปี่ยม",
  "ปวดเมื่อยเล็กน้อย ควรยืดเส้นยืดสาย",
  "หากออกกำลังกายสม่ำเสมอจะเห็นผลชัด",
  "ระวังเรื่องกระเพาะและการพักผ่อน",
  "สุขภาพกายและใจแข็งแรงพร้อมลุย",
];
const FORTUNE_COLOR_POOL = [
  { name: "ทอง", hex: "#d4af37" },
  { name: "เขียว", hex: "#43a047" },
  { name: "ฟ้า", hex: "#29b6f6" },
  { name: "แดง", hex: "#e53935" },
  { name: "เทา", hex: "#78909c" },
  { name: "ส้ม", hex: "#fb8c00" },
  { name: "ม่วง", hex: "#8e24aa" },
  { name: "ชมพู", hex: "#ec407a" },
  { name: "น้ำเงิน", hex: "#3949ab" },
  { name: "น้ำตาล", hex: "#6d4c41" },
];

// Pool sizes (10/9/8/7/11) are pairwise-coprime-ish so their LCM (27720) far exceeds 100 —
// every id 0-99 gets a mathematically distinct (title,work,money,love,health) combination,
// no two cards read identically, without hand-writing 100 full entries.
function buildFortuneData() {
  const data = [];
  for (let i = 0; i < 100; i++) {
    const titleIdx = i % FORTUNE_TITLE_POOL.length;
    data.push({
      id: i + 1,
      stars: Math.floor(titleIdx / 2) + 1,
      title: FORTUNE_TITLE_POOL[titleIdx],
      work: FORTUNE_WORK_POOL[i % FORTUNE_WORK_POOL.length],
      money: FORTUNE_MONEY_POOL[i % FORTUNE_MONEY_POOL.length],
      love: FORTUNE_LOVE_POOL[i % FORTUNE_LOVE_POOL.length],
      health: FORTUNE_HEALTH_POOL[i % FORTUNE_HEALTH_POOL.length],
      luckyNumber: String(i + 1).padStart(2, "0"),
      luckyColor: FORTUNE_COLOR_POOL[i % FORTUNE_COLOR_POOL.length],
    });
  }
  return data;
}

const FORTUNE_DATA = buildFortuneData();
const FORTUNE_HISTORY_MAX = 30;

const FORTUNE_TOPICS = [
  { id: "work", label: "การงาน", icon: "💼" },
  { id: "money", label: "การเงิน", icon: "💰" },
  { id: "love", label: "ความรัก", icon: "❤️" },
  { id: "health", label: "สุขภาพ", icon: "🍀" },
];

const FORTUNE_TOPIC_DATA = {
  work: [
    { id: 1, stars: 5, title: "งานที่ทำอยู่กำลังจะเปล่งประกาย", detail: "ความตั้งใจที่ทุ่มเทมานานเริ่มส่งผล คนรอบข้างเริ่มมองเห็นฝีมือของคุณชัดขึ้น มีโอกาสได้รับมอบหมายงานที่ท้าทายกว่าเดิม", tip: "อย่ากลัวที่จะเสนอไอเดียใหม่ๆ จังหวะนี้เหมาะกับการแสดงศักยภาพ", luckyNumber: "14", luckyColor: { name: "เขียว", hex: "#43a047" } },
    { id: 2, stars: 2, title: "ควรใจเย็นกับปัญหาที่เข้ามา", detail: "อาจมีอุปสรรคเล็กน้อย เช่น ความเห็นไม่ตรงกับเพื่อนร่วมงาน หรือ deadline ที่กระชั้นขึ้น", tip: "สื่อสารให้ชัดเจนตรงไปตรงมา จะช่วยคลี่คลายสถานการณ์ได้เร็วขึ้น", luckyNumber: "27", luckyColor: { name: "เทา", hex: "#78909c" } },
    { id: 3, stars: 5, title: "โอกาสก้าวหน้าในหน้าที่การงานเปิดกว้าง", detail: "มีเกณฑ์ได้รับข้อเสนอใหม่ ไม่ว่าจะเป็นตำแหน่งที่สูงขึ้น โปรเจกต์ใหม่ หรือแม้แต่งานจากที่อื่น", tip: "ก่อนตัดสินใจอะไรใหญ่ ลองชั่งน้ำหนักผลดีผลเสียให้รอบด้าน", luckyNumber: "08", luckyColor: { name: "ทอง", hex: "#d4af37" } },
    { id: 4, stars: 4, title: "งานที่ทำร่วมกับผู้อื่นราบรื่นดี", detail: "การทำงานเป็นทีมช่วงนี้เข้าขากันดี ได้รับความร่วมมือจากเพื่อนร่วมงานเป็นอย่างดี", tip: "ให้เครดิตคนที่ช่วยเหลือคุณเสมอ จะทำให้ความสัมพันธ์ในทีมดีขึ้นไปอีก", luckyNumber: "19", luckyColor: { name: "ฟ้า", hex: "#29b6f6" } },
    { id: 5, stars: 2, title: "ควรพักเรื่องงานไว้ก่อน โฟกัสที่การพักผ่อน", detail: "เป็นช่วงที่พลังงานในการทำงานลดลง อาจรู้สึกเบื่อหรือหมดไฟ", tip: "ลองแบ่งเวลาพักสั้นๆ ระหว่างวัน จะช่วยให้กลับมามีสมาธิได้ดีขึ้น", luckyNumber: "35", luckyColor: { name: "น้ำเงิน", hex: "#3949ab" } },
  ],
  money: [
    { id: 1, stars: 5, title: "มีลาภลอยด้านการเงินเข้ามา", detail: "อาจได้รับเงินก้อนจากที่ไม่คาดคิด เช่น เงินคืนภาษี โบนัส หรือของขวัญ", tip: "แบ่งเงินที่ได้มาส่วนหนึ่งไปเก็บออมหรือลงทุนระยะยาว", luckyNumber: "03", luckyColor: { name: "ทอง", hex: "#d4af37" } },
    { id: 2, stars: 2, title: "ควรระวังเรื่องรายจ่ายที่ไม่จำเป็น", detail: "ช่วงนี้มีแนวโน้มใช้จ่ายเกินตัวโดยไม่รู้ตัว โดยเฉพาะการซื้อของตามอารมณ์", tip: "ลองจดบันทึกรายรับรายจ่ายทุกวันสักสัปดาห์ จะเห็นจุดที่ควรปรับ", luckyNumber: "41", luckyColor: { name: "เทา", hex: "#78909c" } },
    { id: 3, stars: 4, title: "จังหวะดีสำหรับการวางแผนการเงินระยะยาว", detail: "เป็นช่วงที่เหมาะกับการเริ่มออมหรือลงทุนอย่างมีวินัย ผลตอบแทนจะเห็นผลชัดในอนาคต", tip: "เริ่มจากจำนวนเล็กๆ ที่ทำได้สม่ำเสมอ ดีกว่าเริ่มมากแล้วทำต่อไม่ไหว", luckyNumber: "22", luckyColor: { name: "เขียว", hex: "#43a047" } },
    { id: 4, stars: 1, title: "ระวังการให้ยืมเงินก้อนใหญ่ในช่วงนี้", detail: "อาจมีคนใกล้ตัวมาขอยืมเงิน ควรพิจารณาให้รอบคอบก่อนตัดสินใจ", tip: "หากไม่มั่นใจ ให้ปฏิเสธอย่างสุภาพดีกว่าฝืนใจแล้วเสียทั้งเงินทั้งความสัมพันธ์", luckyNumber: "49", luckyColor: { name: "น้ำเงิน", hex: "#3949ab" } },
    { id: 5, stars: 4, title: "รายได้เสริมมีโอกาสเข้ามาแบบไม่ทันตั้งตัว", detail: "อาจมีคนชวนทำงานพิเศษ หรือโอกาสสร้างรายได้ใหม่ๆ ที่ไม่เคยคิดมาก่อน", tip: "ลองเปิดใจรับฟังโอกาสใหม่ๆ ดูสักตั้ง อาจกลายเป็นรายได้หลักในอนาคต", luckyNumber: "17", luckyColor: { name: "ส้ม", hex: "#fb8c00" } },
  ],
  love: [
    { id: 1, stars: 5, title: "ความรักหวานชื่น มีเซอร์ไพรส์รออยู่", detail: "คู่รักจะได้ใช้เวลาดีๆ ร่วมกัน ความสัมพันธ์แน่นแฟ้นขึ้นอีกขั้น", tip: "ลองวางแผนกิจกรรมพิเศษร่วมกัน จะช่วยเติมความหวานให้ความสัมพันธ์", luckyNumber: "07", luckyColor: { name: "ชมพู", hex: "#ec407a" } },
    { id: 2, stars: 4, title: "คนโสดมีเกณฑ์ได้พบเจอคนถูกใจ", detail: "อาจได้เจอคนใหม่ผ่านคนรู้จักหรือกิจกรรมที่ไม่คาดคิด", tip: "เปิดใจให้กว้างขึ้น อย่าปิดกั้นตัวเองจากโอกาสใหม่ๆ", luckyNumber: "12", luckyColor: { name: "แดง", hex: "#e53935" } },
    { id: 3, stars: 2, title: "อาจมีความเข้าใจผิดเล็กน้อยในความสัมพันธ์", detail: "การสื่อสารที่ไม่ชัดเจนอาจทำให้เกิดความน้อยใจกันได้ง่าย", tip: "เปิดใจคุยกันตรงๆ ดีกว่าปล่อยให้เรื่องเล็กกลายเป็นเรื่องใหญ่", luckyNumber: "44", luckyColor: { name: "เทา", hex: "#78909c" } },
    { id: 4, stars: 3, title: "คนที่ห่างหายอาจกลับมาติดต่อ", detail: "มีโอกาสได้รับข่าวจากคนที่เคยสำคัญ หรือคนที่ขาดการติดต่อไปนาน", tip: "รับฟังด้วยใจเปิดกว้าง แต่ก็อย่าลืมพิจารณาด้วยเหตุผล", luckyNumber: "29", luckyColor: { name: "ม่วง", hex: "#8e24aa" } },
    { id: 5, stars: 3, title: "ให้เวลาตัวเองสักพักก่อนเปิดใจใหม่", detail: "ช่วงนี้เหมาะกับการอยู่กับตัวเองมากกว่าเร่งหาความสัมพันธ์ใหม่", tip: "การรักตัวเองให้เป็นก่อน จะทำให้ความสัมพันธ์ครั้งต่อไปมั่นคงกว่าเดิม", luckyNumber: "38", luckyColor: { name: "ฟ้า", hex: "#29b6f6" } },
  ],
  health: [
    { id: 1, stars: 5, title: "พลังงานเต็มเปี่ยม เหมาะกับการเริ่มกิจกรรมใหม่", detail: "ร่างกายแข็งแรงพร้อมลุย เป็นช่วงที่เหมาะกับการออกกำลังกายหรือเริ่มกิจวัตรใหม่ๆ", tip: "ลองตั้งเป้าหมายสุขภาพเล็กๆ ที่ทำได้จริง แล้วค่อยๆ เพิ่มความท้าทาย", luckyNumber: "09", luckyColor: { name: "ทอง", hex: "#d4af37" } },
    { id: 2, stars: 2, title: "ควรพักผ่อนให้มากขึ้นกว่าที่ผ่านมา", detail: "ร่างกายส่งสัญญาณเหนื่อยล้าสะสม อาจรู้สึกไม่สดชื่นแม้จะนอนเต็มที่", tip: "ลองปรับเวลานอนให้เป็นเวลาเดียวกันทุกวัน จะช่วยให้ร่างกายฟื้นตัวได้ดีขึ้น", luckyNumber: "48", luckyColor: { name: "น้ำเงิน", hex: "#3949ab" } },
    { id: 3, stars: 2, title: "ระวังเรื่องกระเพาะและระบบย่อยอาหาร", detail: "การกินอาหารไม่เป็นเวลาหรือเครียดสะสมอาจส่งผลต่อระบบย่อยอาหาร", tip: "ลองกินอาหารให้ตรงเวลาและเคี้ยวให้ละเอียดขึ้น จะช่วยได้มาก", luckyNumber: "13", luckyColor: { name: "น้ำตาล", hex: "#6d4c41" } },
    { id: 4, stars: 4, title: "สุขภาพจิตดีขึ้นอย่างเห็นได้ชัด", detail: "ความเครียดที่สะสมมาเริ่มคลี่คลาย ใจเบาขึ้น มองโลกในแง่ดีมากขึ้น", tip: "หากิจกรรมที่ทำให้ผ่อนคลายทำเป็นประจำ จะช่วยรักษาสมดุลนี้ไว้ได้นาน", luckyNumber: "21", luckyColor: { name: "เขียว", hex: "#43a047" } },
    { id: 5, stars: 4, title: "หากออกกำลังกายสม่ำเสมอจะเห็นผลชัดเจน", detail: "เป็นช่วงที่ร่างกายตอบสนองต่อการดูแลตัวเองได้ดีเป็นพิเศษ", tip: "เลือกกิจกรรมที่ชอบจริงๆ จะทำให้ทำต่อเนื่องได้ง่ายกว่า", luckyNumber: "16", luckyColor: { name: "ฟ้า", hex: "#29b6f6" } },
  ],
};

function loadFortuneState() {
  try {
    const raw = localStorage.getItem("toolhub.fortune");
    if (raw) {
      const s = JSON.parse(raw);
      return {
        mode: s.mode === "topic" ? "topic" : "daily",
        dailyLastId: typeof s.dailyLastId === "number" && FORTUNE_DATA.some((f) => f.id === s.dailyLastId) ? s.dailyLastId : null,
        topicLast:
          s.topicLast && typeof s.topicLast.topic === "string" && typeof s.topicLast.id === "number"
            ? s.topicLast
            : null,
        history: Array.isArray(s.history)
          ? s.history.filter(
              (h) =>
                h &&
                typeof h.time === "number" &&
                ((h.type === "daily" && typeof h.id === "number") ||
                  (h.type === "topic" && typeof h.topic === "string" && typeof h.id === "number"))
            )
          : [],
      };
    }
  } catch (e) {}
  return { mode: "daily", dailyLastId: null, topicLast: null, history: [] };
}

function saveFortuneState(state) {
  localStorage.setItem("toolhub.fortune", JSON.stringify(state));
}

function fortuneFormatTime(ts) {
  return new Date(ts).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

function fortuneHistoryPush(state, entry) {
  state.history.unshift({ ...entry, time: Date.now() });
  if (state.history.length > FORTUNE_HISTORY_MAX) state.history.length = FORTUNE_HISTORY_MAX;
}

// Resolves a history entry back to its {icon, title, stars, sub, cardHtml} for display —
// returns null if the entry references data that no longer exists (shouldn't normally happen).
function fortuneHistoryResolve(h) {
  if (h.type === "daily") {
    const f = FORTUNE_DATA.find((x) => x.id === h.id);
    return f ? { icon: "🔮", title: f.title, stars: f.stars, sub: "ประจำวัน", cardHtml: fortuneCardHtml(f) } : null;
  }
  const t = FORTUNE_TOPICS.find((x) => x.id === h.topic);
  const f = t && FORTUNE_TOPIC_DATA[h.topic] ? FORTUNE_TOPIC_DATA[h.topic].find((x) => x.id === h.id) : null;
  return t && f ? { icon: t.icon, title: f.title, stars: f.stars, sub: t.label, cardHtml: fortuneTopicCardHtml(t, f) } : null;
}

function fortuneStarsHtml(stars) {
  return Array.from({ length: 5 }, (_, i) => `<span class="fortune-star ${i < stars ? "filled" : ""}">★</span>`).join("");
}

function fortuneHexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const FORTUNE_BG_BASE = "#05060a";

function fortuneApplyTint(wrapEl, hex) {
  wrapEl.style.background = hex
    ? `radial-gradient(circle at 50% 18%, ${fortuneHexToRgba(hex, 0.4)} 0%, ${FORTUNE_BG_BASE} 70%)`
    : FORTUNE_BG_BASE;
}

function fortuneModeTabsHtml(active) {
  return `
    <div class="fortune-mode-row">
      <button class="fortune-mode-btn ${active === "daily" ? "active" : ""}" data-mode="daily">ประจำวัน</button>
      <button class="fortune-mode-btn ${active === "topic" ? "active" : ""}" data-mode="topic">เฉพาะเรื่อง</button>
    </div>
  `;
}

// Pinned to the bottom of .fortune-wrap via margin-top:auto (see fortune.css) — kept out of
// the mode-tabs row so it doesn't scroll away with the rest of the idle content.
function fortuneHistoryButtonHtml(historyCount) {
  return `<button class="fortune-history-fab" id="fortuneHistoryBtn">📜 ประวัติ${historyCount ? ` (${historyCount})` : ""}</button>`;
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

function fortuneTopicCardHtml(topic, f) {
  return `
    <div class="fortune-card-id">${topic.icon} ${topic.label}</div>
    <div class="fortune-card-stars">${fortuneStarsHtml(f.stars)}</div>
    <div class="fortune-card-title">${f.title}</div>
    <div class="fortune-topic-detail">${f.detail}</div>
    <div class="fortune-topic-tip"><span class="fortune-topic-tip-label">คำแนะนำ</span>${f.tip}</div>
    <div class="fortune-card-footer">
      <div class="fortune-lucky"><span class="fortune-lucky-label">เลขมงคล</span><span class="fortune-lucky-value">${f.luckyNumber}</span></div>
      <div class="fortune-lucky"><span class="fortune-lucky-label">สีมงคล</span><span class="fortune-color-swatch" style="background:${f.luckyColor.hex}"></span><span class="fortune-lucky-value">${f.luckyColor.name}</span></div>
    </div>
  `;
}

function renderFortune(container) {
  const state = loadFortuneState();

  function draw() {
    if (state.mode === "topic") drawTopicIdle();
    else drawDailyIdle();
  }

  function bindModeTabs() {
    container.querySelectorAll(".fortune-mode-btn[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.mode === state.mode) return;
        state.mode = btn.dataset.mode;
        saveFortuneState(state);
        draw();
      });
    });
    container.querySelector("#fortuneHistoryBtn").addEventListener("click", () => {
      showFortuneHistoryOverlay(state.history, () => {
        state.history = [];
        saveFortuneState(state);
        draw();
      });
    });
  }

  function drawDailyIdle() {
    const last = state.dailyLastId !== null ? FORTUNE_DATA.find((f) => f.id === state.dailyLastId) : null;

    container.innerHTML = `
      <div class="fortune-wrap" id="fortuneWrap">
        ${fortuneModeTabsHtml("daily")}
        <button class="fortune-orb-btn" id="fortuneOrbBtn" aria-label="ดูดวง">
          <span class="fortune-orb-icon">🔮</span>
        </button>
        <div class="fortune-hint">แตะลูกแก้วเพื่อดูดวง — ดูได้เรื่อยๆ ไม่จำกัดรอบ</div>
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
        ${fortuneHistoryButtonHtml(state.history.length)}
      </div>
    `;

    fortuneApplyTint(container.querySelector("#fortuneWrap"), last ? last.luckyColor.hex : null);
    bindModeTabs();
    container.querySelector("#fortuneOrbBtn").addEventListener("click", revealDaily);
    const lastCard = container.querySelector("#fortuneLastCard");
    if (lastCard) lastCard.addEventListener("click", () => showFortuneOverlay(fortuneCardHtml(last), "ดูดวงอีกครั้ง", revealDaily));
  }

  function revealDaily() {
    const orb = container.querySelector("#fortuneOrbBtn");
    if (!orb || orb.classList.contains("glowing")) return;
    orb.classList.add("glowing");
    setTimeout(() => {
      const candidates = FORTUNE_DATA.filter((f) => f.id !== state.dailyLastId);
      const pool = candidates.length ? candidates : FORTUNE_DATA;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      state.dailyLastId = picked.id;
      fortuneHistoryPush(state, { type: "daily", id: picked.id });
      saveFortuneState(state);
      draw();
      showFortuneOverlay(fortuneCardHtml(picked), "ดูดวงอีกครั้ง", revealDaily);
    }, 700);
  }

  function drawTopicIdle() {
    const lastTopic = state.topicLast ? FORTUNE_TOPICS.find((t) => t.id === state.topicLast.topic) : null;
    const lastFortune = state.topicLast ? FORTUNE_TOPIC_DATA[state.topicLast.topic].find((f) => f.id === state.topicLast.id) : null;

    container.innerHTML = `
      <div class="fortune-wrap" id="fortuneWrap">
        ${fortuneModeTabsHtml("topic")}
        <div class="fortune-hint">เลือกเรื่องที่อยากดูดวง</div>
        <div class="fortune-topic-row">
          ${FORTUNE_TOPICS.map(
            (t) => `
          <button class="fortune-topic-btn" data-topic="${t.id}">
            <span class="fortune-topic-icon">${t.icon}</span><span>${t.label}</span>
          </button>`
          ).join("")}
        </div>
        ${
          lastTopic && lastFortune
            ? `<button class="fortune-last-card" id="fortuneLastCard">
                <div class="fortune-last-label">ผลล่าสุด — ${lastTopic.icon} ${lastTopic.label}</div>
                <div class="fortune-last-row">
                  <span class="fortune-last-stars">${fortuneStarsHtml(lastFortune.stars)}</span>
                </div>
                <div class="fortune-last-title">${lastFortune.title}</div>
              </button>`
            : ""
        }
        ${fortuneHistoryButtonHtml(state.history.length)}
      </div>
    `;

    fortuneApplyTint(container.querySelector("#fortuneWrap"), lastFortune ? lastFortune.luckyColor.hex : null);
    bindModeTabs();
    container.querySelectorAll(".fortune-topic-btn").forEach((btn) => {
      btn.addEventListener("click", () => revealTopic(btn.dataset.topic));
    });
    const lastCard = container.querySelector("#fortuneLastCard");
    if (lastCard) {
      lastCard.addEventListener("click", () =>
        showFortuneOverlay(fortuneTopicCardHtml(lastTopic, lastFortune), "สุ่มใหม่", () => revealTopic(lastTopic.id))
      );
    }
  }

  function revealTopic(topicId) {
    const pool = FORTUNE_TOPIC_DATA[topicId];
    const lastId = state.topicLast && state.topicLast.topic === topicId ? state.topicLast.id : null;
    const candidates = pool.filter((f) => f.id !== lastId);
    const picked = (candidates.length ? candidates : pool)[Math.floor(Math.random() * (candidates.length || pool.length))];
    state.topicLast = { topic: topicId, id: picked.id };
    fortuneHistoryPush(state, { type: "topic", topic: topicId, id: picked.id });
    saveFortuneState(state);
    draw();
    const topic = FORTUNE_TOPICS.find((t) => t.id === topicId);
    showFortuneOverlay(fortuneTopicCardHtml(topic, picked), "สุ่มใหม่", () => revealTopic(topicId));
  }

  draw();
}

function showFortuneOverlay(cardHtml, nextLabel, onNext) {
  const overlay = document.createElement("div");
  overlay.className = "fortune-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="fortune-overlay-card">${cardHtml}</div>
    ${nextLabel ? `<button class="fortune-overlay-next-btn" id="fortuneOverlayNextBtn">${nextLabel}</button>` : ""}
    <div class="fortune-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".fortune-overlay-card").addEventListener("click", (e) => e.stopPropagation());
  if (nextLabel) {
    overlay.querySelector("#fortuneOverlayNextBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.remove();
      onNext();
    });
  }
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}

// Combined history across both modes, newest first — tapping an entry reopens its full
// card via showFortuneOverlay (read-only, no "next" button since it's a past reveal).
function showFortuneHistoryOverlay(history, onClearAll) {
  const entries = history.map((h) => ({ h, info: fortuneHistoryResolve(h) })).filter((e) => e.info);
  const overlay = document.createElement("div");
  overlay.className = "fortune-history-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="fortune-history-panel">
      <div class="fortune-history-title">ประวัติดูดวง</div>
      <div class="fortune-history-list">
        ${
          entries.length === 0
            ? `<div class="fortune-history-empty">ยังไม่มีประวัติ</div>`
            : entries
                .map(
                  ({ h, info }, i) => `
          <button class="fortune-history-item" data-idx="${i}">
            <span class="fortune-history-item-icon">${info.icon}</span>
            <span class="fortune-history-item-body">
              <span class="fortune-history-item-title">${info.title}</span>
              <span class="fortune-history-item-meta">${info.sub} · ${fortuneStarsHtml(info.stars)}</span>
            </span>
            <span class="fortune-history-item-time">${fortuneFormatTime(h.time)}</span>
          </button>`
                )
                .join("")
        }
      </div>
      ${entries.length > 0 ? `<button class="fortune-history-clear-btn" id="fortuneHistoryClearBtn">ล้างประวัติ</button>` : ""}
    </div>
    <div class="fortune-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".fortune-history-panel").addEventListener("click", (e) => e.stopPropagation());
  overlay.querySelectorAll(".fortune-history-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { info } = entries[Number(btn.dataset.idx)];
      overlay.remove();
      showFortuneOverlay(info.cardHtml, null, null);
    });
  });
  const clearBtn = overlay.querySelector("#fortuneHistoryClearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      overlay.remove();
      onClearAll();
    });
  }
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
