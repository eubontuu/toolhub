// Flash Quiz — depends on shuffleArray + saveWongLaoState (tools/wonglao-core.js, must load first)

const FLASH_QUIZ_QUESTIONS = [
  "1 บวก 1 เท่ากับเท่าไหร่?",
  "น้ำเดือดที่กี่องศาเซลเซียส?",
  "ประเทศไทยมีกี่ภาค?",
  "หนึ่งสัปดาห์มีกี่วัน?",
  "หนึ่งปีมีกี่เดือน?",
  "เมืองหลวงของประเทศไทยคือที่ไหน?",
  "ธงชาติไทยมีกี่สี?",
  "ดวงอาทิตย์ขึ้นทางทิศไหน?",
  "ดวงอาทิตย์ตกทางทิศไหน?",
  "แมวร้องว่าอย่างไร?",
  "สุนัขร้องว่าอย่างไร?",
  "น้ำแข็งทำมาจากอะไร?",
  "ใบไม้ส่วนใหญ่มีสีอะไร?",
  "หนึ่งชั่วโมงมีกี่นาที?",
  "หนึ่งนาทีมีกี่วินาที?",
  "ไทยใช้สกุลเงินอะไร?",
  "7 คูณ 8 เท่ากับเท่าไหร่?",
  "10 หาร 2 เท่ากับเท่าไหร่?",
  "ดาวเคราะห์ที่ใกล้ดวงอาทิตย์ที่สุดคือดวงไหน?",
  "ดาวเคราะห์ที่เราอาศัยอยู่ชื่อว่าอะไร?",
  "กบร้องว่าอย่างไร?",
  "ไก่ร้องตอนเช้าว่าอย่างไร?",
  "มนุษย์มีกี่นิ้วต่อมือ?",
  "ผลไม้ชนิดใดที่คนไทยเรียกว่า \"ราชาผลไม้\"?",
  "สัตว์ชนิดใดที่คอยาวที่สุด?",
  "สัตว์ชนิดใดที่ตัวใหญ่ที่สุดในโลก?",
  "ไข่ไก่ปกติมีสีอะไร?",
  "ท้องฟ้าเวลากลางวันปกติมีสีอะไร?",
  "น้ำทะเลมีรสชาติอย่างไร?",
  "มะนาวมีรสชาติอย่างไร?",
  "น้ำตาลมีรสชาติอย่างไร?",
  "เดือนที่มีวันน้อยที่สุดในหนึ่งปีคือเดือนอะไร?",
  "1 กิโลกรัมเท่ากับกี่กรัม?",
  "รุ้งกินน้ำมีกี่สี?",
  "ทวีปที่ประเทศไทยตั้งอยู่คือทวีปอะไร?",
  "เดือนแรกของปีคือเดือนอะไร?",
  "เดือนสุดท้ายของปีคือเดือนอะไร?",
];

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
        <button class="reset-btn" id="quizReshuffleBtn">สับคำถามใหม่</button>
      </div>
    `;

    body.querySelector("#quizDrawBtn").addEventListener("click", () => {
      state.quizLast = state.quizDeck.pop();
      saveWongLaoState(state);
      draw();
    });

    body.querySelector("#quizReshuffleBtn").addEventListener("click", () => {
      state.quizDeck = buildQuizDeck();
      state.quizLast = null;
      saveWongLaoState(state);
      draw();
    });
  }

  draw();
}
