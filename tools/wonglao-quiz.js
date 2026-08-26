// Flash Quiz — depends on shuffleArray + saveWongLaoState (tools/wonglao-core.js, must load first)

const FLASH_QUIZ_QA = [
  { q: "1 บวก 1 เท่ากับเท่าไหร่?", a: "2" },
  { q: "น้ำเดือดที่กี่องศาเซลเซียส?", a: "100 องศาเซลเซียส" },
  { q: "ประเทศไทยมีกี่ภาค?", a: "4 ภาค (บางตำราแบ่งเป็น 6 ภาค)" },
  { q: "หนึ่งสัปดาห์มีกี่วัน?", a: "7 วัน" },
  { q: "หนึ่งปีมีกี่เดือน?", a: "12 เดือน" },
  { q: "เมืองหลวงของประเทศไทยคือที่ไหน?", a: "กรุงเทพมหานคร" },
  { q: "ธงชาติไทยมีกี่สี?", a: "3 สี (แดง ขาว น้ำเงิน)" },
  { q: "ดวงอาทิตย์ขึ้นทางทิศไหน?", a: "ทิศตะวันออก" },
  { q: "ดวงอาทิตย์ตกทางทิศไหน?", a: "ทิศตะวันตก" },
  { q: "แมวร้องว่าอย่างไร?", a: "เหมียว" },
  { q: "สุนัขร้องว่าอย่างไร?", a: "โฮ่ง / บ๊อก" },
  { q: "น้ำแข็งทำมาจากอะไร?", a: "น้ำ (แช่แข็ง)" },
  { q: "ใบไม้ส่วนใหญ่มีสีอะไร?", a: "สีเขียว" },
  { q: "หนึ่งชั่วโมงมีกี่นาที?", a: "60 นาที" },
  { q: "หนึ่งนาทีมีกี่วินาที?", a: "60 วินาที" },
  { q: "ไทยใช้สกุลเงินอะไร?", a: "บาท" },
  { q: "7 คูณ 8 เท่ากับเท่าไหร่?", a: "56" },
  { q: "10 หาร 2 เท่ากับเท่าไหร่?", a: "5" },
  { q: "ดาวเคราะห์ที่ใกล้ดวงอาทิตย์ที่สุดคือดวงไหน?", a: "ดาวพุธ" },
  { q: "ดาวเคราะห์ที่เราอาศัยอยู่ชื่อว่าอะไร?", a: "โลก" },
  { q: "กบร้องว่าอย่างไร?", a: "อ๊บๆ" },
  { q: "ไก่ร้องตอนเช้าว่าอย่างไร?", a: "เอ้กอี๊เอ้กเอ้ก" },
  { q: "มนุษย์มีกี่นิ้วต่อมือ?", a: "5 นิ้ว" },
  { q: "ผลไม้ชนิดใดที่คนไทยเรียกว่า \"ราชาผลไม้\"?", a: "ทุเรียน" },
  { q: "สัตว์ชนิดใดที่คอยาวที่สุด?", a: "ยีราฟ" },
  { q: "สัตว์ชนิดใดที่ตัวใหญ่ที่สุดในโลก?", a: "วาฬสีน้ำเงิน" },
  { q: "ไข่ไก่ปกติมีสีอะไร?", a: "สีน้ำตาลหรือขาว (แล้วแต่สายพันธุ์)" },
  { q: "ท้องฟ้าเวลากลางวันปกติมีสีอะไร?", a: "สีฟ้า" },
  { q: "น้ำทะเลมีรสชาติอย่างไร?", a: "เค็ม" },
  { q: "มะนาวมีรสชาติอย่างไร?", a: "เปรี้ยว" },
  { q: "น้ำตาลมีรสชาติอย่างไร?", a: "หวาน" },
  { q: "เดือนที่มีวันน้อยที่สุดในหนึ่งปีคือเดือนอะไร?", a: "กุมภาพันธ์" },
  { q: "1 กิโลกรัมเท่ากับกี่กรัม?", a: "1,000 กรัม" },
  { q: "รุ้งกินน้ำมีกี่สี?", a: "7 สี" },
  { q: "ทวีปที่ประเทศไทยตั้งอยู่คือทวีปอะไร?", a: "ทวีปเอเชีย" },
  { q: "เดือนแรกของปีคือเดือนอะไร?", a: "มกราคม" },
  { q: "เดือนสุดท้ายของปีคือเดือนอะไร?", a: "ธันวาคม" },
  // ชุดคำถามง่ายๆ ที่ทุกคนตอบได้ — ความรู้ทั่วไปพื้นฐาน
  { q: "ไฟเขียวแปลว่าอะไร?", a: "ไปได้" },
  { q: "ไฟแดงแปลว่าอะไร?", a: "หยุด" },
  { q: "2 บวก 2 เท่ากับเท่าไหร่?", a: "4" },
  { q: "5 ลบ 2 เท่ากับเท่าไหร่?", a: "3" },
  { q: "พ่อของแม่เราเรียกว่าอะไร?", a: "ตา" },
  { q: "แม่ของแม่เราเรียกว่าอะไร?", a: "ยาย" },
  { q: "วัวให้อะไรเรากิน?", a: "นม" },
  { q: "ไก่ออกอะไร?", a: "ไข่" },
  { q: "เราใช้อะไรมองเห็นสิ่งต่างๆ?", a: "ตา" },
  { q: "เราใช้อะไรได้ยินเสียง?", a: "หู" },
  { q: "เราใช้อะไรดมกลิ่น?", a: "จมูก" },
  { q: "เราฉลองปีใหม่สากลวันที่เท่าไหร่?", a: "1 มกราคม" },
  { q: "วันคริสต์มาสตรงกับวันที่เท่าไหร่?", a: "25 ธันวาคม" },
  { q: "น้ำแข็งเย็นหรือร้อน?", a: "เย็น" },
  { q: "ตอนกลางวันสว่างหรือมืด?", a: "สว่าง" },
  { q: "ตอนกลางคืนสว่างหรือมืด?", a: "มืด" },
];

const FLASH_QUIZ_QUESTIONS = FLASH_QUIZ_QA.map((item) => item.q);

function buildQuizDeck() {
  return shuffleArray(FLASH_QUIZ_QUESTIONS);
}

function renderFlashQuizGame(body, state) {
  if (!state.quizDeck) {
    state.quizDeck = buildQuizDeck();
    saveWongLaoState(state);
  }

  function draw() {
    const deckEmpty = state.quizDeck.length === 0;
    body.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-count">เหลือ ${state.quizDeck.length} ข้อ</div>
        <div class="quiz-card ${state.quizLast ? "" : "empty"}">
          <span class="quiz-card-text">${state.quizLast || "❓"}</span>
        </div>
        <button class="wl-action-btn" id="quizDrawBtn" ${deckEmpty ? "disabled" : ""}>เปิดคำถาม</button>
        <div class="quiz-secondary-row">
          <button class="reset-btn" id="quizReshuffleBtn">สับคำถามใหม่</button>
          <button class="reset-btn" id="quizQaBtn">📖 คำถาม/เฉลย</button>
        </div>
      </div>
    `;

    body.querySelector("#quizDrawBtn").addEventListener("click", () => {
      state.quizLast = state.quizDeck.pop();
      saveWongLaoState(state);
      draw();
      showQuizOverlay(state.quizLast);
    });

    body.querySelector("#quizReshuffleBtn").addEventListener("click", () => {
      state.quizDeck = buildQuizDeck();
      state.quizLast = null;
      saveWongLaoState(state);
      draw();
    });

    body.querySelector("#quizQaBtn").addEventListener("click", () => {
      showQuizQaOverlay();
    });
  }

  draw();
}

function showQuizOverlay(questionText) {
  const overlay = document.createElement("div");
  overlay.className = "quiz-overlay";
  overlay.innerHTML = `
    <div class="quiz-overlay-card">
      <span class="quiz-overlay-text">${questionText}</span>
    </div>
    <div class="quiz-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}

function showQuizQaOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "quiz-qa-overlay";
  overlay.innerHTML = `
    <div class="quiz-qa-header">
      <button class="back-btn" id="quizQaClose">‹</button>
      <div class="quiz-qa-title">คำถาม/เฉลย</div>
    </div>
    <input type="text" id="quizQaSearch" class="quiz-qa-search" placeholder="พิมพ์ค้นหาคำถามหรือคำตอบ..." />
    <div class="quiz-qa-list" id="quizQaList"></div>
  `;
  document.body.appendChild(overlay);

  const list = overlay.querySelector("#quizQaList");
  const search = overlay.querySelector("#quizQaSearch");

  function renderList(query) {
    const q = query.trim();
    const items = q
      ? FLASH_QUIZ_QA.filter((item) => item.q.includes(q) || item.a.includes(q))
      : FLASH_QUIZ_QA;
    list.innerHTML = items.length
      ? items
          .map(
            (item) => `
        <div class="quiz-qa-item">
          <div class="quiz-qa-q">${item.q}</div>
          <div class="quiz-qa-a">เฉลย: ${item.a}</div>
        </div>
      `
          )
          .join("")
      : `<div class="quiz-qa-empty">ไม่พบคำถามที่ตรงกับ "${q}"</div>`;
  }

  search.addEventListener("input", () => renderList(search.value));
  overlay.querySelector("#quizQaClose").addEventListener("click", () => overlay.remove());

  renderList("");
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
