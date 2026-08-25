// ไพ่สุ่ม — depends on shuffleArray + saveWongLaoState (tools/wonglao-core.js, must load first)

const RC_CORE_PROMPTS = [
  "ดื่มทั้งวง",
  "พัก 1 รอบ ห้ามดื่ม",
  "ผู้ชายในวงดื่มพร้อมกัน",
  "ผู้หญิงในวงดื่มพร้อมกัน",
  "คนตัวเตี้ยที่สุดในวงโดน",
  "คนตัวสูงที่สุดในวงโดน",
  "ห้ามพูดคำหยาบ 1 รอบ ใครหลุดโดนดื่ม",
  "ทุกคนยืนขึ้น 1 รอบ ใครนั่งก่อนโดนดื่ม",
  "ปิดตาข้างเดียวไว้ 1 รอบ ใครลืมโดนดื่ม",
  "บอกวันเกิดของคนข้างๆ ตอบไม่ได้โดนดื่ม",
  "เลือกคนดื่ม 1 คนตามใจชอบ",
  "คนที่เกิดวันที่เป็นเลขคี่โดน",
  "คนที่เกิดวันที่เป็นเลขคู่โดน",
  "คนทางซ้ายมือดื่ม",
  "คนทางขวามือดื่ม",
  "คนที่จั่วไพ่ใบนี้ดื่มเอง",
  "ทุกคนชนแก้วแล้วดื่มพร้อมกัน",
  "ห้ามยิ้ม 1 รอบ ใครยิ้มก่อนโดนดื่ม",
  "ห้ามใช้มือซ้ายหยิบจับอะไรเลย 1 รอบ ใครทำผิดโดนดื่ม",
  "คนที่มาถึงวงนี้ล่าสุดโดน",
  "คนที่ใส่รองเท้าผ้าใบวันนี้โดน",
  "คนโสดในวงโดน",
  "คนมีแฟนในวงโดน",
  "นับ 3 2 1 ทุกคนชี้นิ้วไปที่คนที่คิดว่าจะโดน คนที่ถูกชี้เยอะสุดดื่ม",
  "ร้องเพลงฮิตท่อนฮุก ใครร้องไม่ได้โดนดื่ม",
  "ทายใจคนทางขวามือ 1 ข้อ ทายผิดโดนดื่ม",
  "จับคู่กับคนข้างๆ ดื่มพร้อมกัน",
  "ดื่มวนรอบวงทวนเข็มนาฬิกา 1 รอบ",
  "เช็คแบตมือถือ คนแบตต่ำสุดโดน",
  "เจ้าของวงชี้ใครก็ได้ 1 คนดื่มฟรีไม่ต้องมีเหตุผล",
  "ดวลเป่ายิงฉุบ ผู้แพ้ดื่ม 2 ที",
  "หมุนขวดกลางวง ปลายขวดชี้ใครคนนั้นโดน",
  "คนที่กำลังถือโทรศัพท์อยู่ตอนนี้โดน",
  "คนที่ใส่แว่นตาโดน",
  "คนที่ไม่ได้ใส่แว่นตาโดน",
  "คนที่ใส่นาฬิกาข้อมือโดน",
  "คนที่ผมยาวกว่าคนข้างๆโดน",
  "คนที่ขับรถยนต์มาวันนี้โดน",
  "คนที่ขับมอเตอร์ไซค์มาวันนี้โดน",
  "ทุกคนยกแก้วชนกันก่อนดื่มรอบนี้",
  "คนที่ดื่มช้าสุดในรอบที่แล้วดื่มเพิ่ม 1 ที",
  "คนที่หมดแก้วก่อนใครในรอบที่แล้วเลือกคนดื่มรอบนี้",
  "จับคู่ 2 คน ดื่มพร้อมกันตอนนี้เลย",
  "คนถัดไปตามเข็มนาฬิกาดื่ม",
  "คนถัดไปทวนเข็มนาฬิกาดื่ม",
];

const RC_CHALLENGE_PROMPTS = [
  "ห้ามไขว่ห้าง 1 รอบ ใครทำผิดโดนดื่ม",
  "ห้ามเรียกชื่อตัวเอง 1 รอบ ใครทำผิดโดนดื่ม",
  'ต้องพูด "ครับ/ค่ะ" ท้ายทุกประโยค 1 รอบ ใครลืมโดนดื่ม',
  "ห้ามหันหน้าไปทางซ้าย 1 รอบ ใครทำผิดโดนดื่ม",
  'ห้ามเรียกชื่อเพื่อนตรงๆ ต้องเรียก "นาย" หรือ "เธอ" แทน 1 รอบ ใครทำผิดโดนดื่ม',
  "ห้ามแตะโทรศัพท์ 1 รอบ ใครทำผิดโดนดื่ม",
  "ห้ามวางแขนบนโต๊ะ 1 รอบ ใครทำผิดโดนดื่ม",
  "ทุกครั้งที่มีคนพูด ต้องชี้นิ้วไปที่คนนั้น 1 รอบ ใครลืมโดนดื่ม",
  'ห้ามพูดคำว่า "ใช่" หรือ "ไม่ใช่" 1 รอบ ใครทำผิดโดนดื่ม',
  'ห้ามพูดคำว่า "เมา" 1 รอบ ใครหลุดโดนดื่ม',
  "ห้ามกระพริบตาตอนถูกจ้อง 5 วินาที ใครกระพริบก่อนโดนดื่ม",
  "ห้ามพูดชื่อสัตว์เลี้ยงตัวเอง 1 รอบ ใครทำผิดโดนดื่ม",
  "ห้ามพูดภาษาไทย 1 รอบ ใครหลุดไทยโดนดื่ม",
  "ห้ามชี้นิ้วใส่ใคร 1 รอบ ใครทำผิดโดนดื่ม",
  'ห้ามพูดคำว่า "ไม่" 1 รอบ ใครทำผิดโดนดื่ม',
];

const RC_SUPERLATIVE_PROMPTS = [
  "คนที่อายุมากที่สุดในวงโดน",
  "คนที่อายุน้อยที่สุดในวงโดน",
  "คนที่มือใหญ่ที่สุดในวงโดน",
  "คนที่เท้าใหญ่ที่สุดในวงโดน",
  "คนที่ผมยาวที่สุดในวงโดน",
  "คนที่ผมสั้นที่สุดในวงโดน",
  "คนที่นาฬิกาแพงที่สุดเท่าที่รู้โดน",
  "คนที่แบตโทรศัพท์เหลือน้อยที่สุดโดน",
  "คนที่มีเงินสดในกระเป๋าน้อยที่สุดโดน",
  "คนที่มีเงินสดในกระเป๋ามากที่สุดโดน",
  "คนที่มาถึงงานคนแรกโดน",
  "คนที่มาถึงงานคนสุดท้ายโดน",
  "คนที่นั่งตรงข้ามเจ้าของวงโดน",
  "คนถัดจากคนที่เพิ่งดื่มไปโดนต่อ",
  "คนที่หัวเราะดังที่สุดตอนนี้โดน",
  "คนที่เงียบที่สุดในวงตอนนี้โดน",
  "คนที่พูดเยอะที่สุดในวงตอนนี้โดน",
  "คนที่เพิ่งหัวเราะล่าสุดโดน",
  "คนที่ถือแก้วอยู่ตอนนี้โดน",
  "คนที่นั่งใกล้ประตูที่สุดโดน",
];

const RC_TIMED_PROMPTS = [
  "ทำหน้าตลกค้างไว้ 5 วินาที ใครหลุดหัวเราะก่อนโดน",
  "จ้องตาคนขวามือ 10 วินาทีห้ามกระพริบ ใครแพ้โดน",
  "ยืนขาเดียว 10 วินาที ใครวางเท้าก่อนโดน",
  "ปรบมือตามจังหวะที่เจ้าของวงตบ 10 วินาที ใครหลุดจังหวะโดน",
  "พูดตัวอักษร ก-ฮ ให้เร็วที่สุดโดยไม่ติด ใครติดโดน",
  "เขย่งเท้ายืน 10 วินาที ใครเซโดน",
  "ยิ้มแบบไม่ให้เห็นฟัน 10 วินาที ใครทำไม่ได้โดน",
  "ทำหน้านิ่งให้เพื่อนแหย่ 10 วินาที ใครหลุดโดน",
  "กอดอกห้ามขยับ 10 วินาที ใครขยับก่อนโดน",
  "พูดชื่อตัวเองกลับหลัง ใครพูดไม่ได้ใน 10 วินาทีโดน",
];

const RC_QUESTION_PROMPTS = [
  "เล่าเรื่องที่อายที่สุดที่เคยทำ ไม่เล่าโดนดื่ม",
  "บอกว่าถ้าได้เงินล้านวันนี้จะทำอะไรก่อน ไม่ตอบโดนดื่ม",
  "บอกสิ่งที่กลัวที่สุดในโลก ไม่ตอบโดนดื่ม",
  "บอกเพลงที่ฟังวนตอนอกหัก ไม่ตอบโดนดื่ม",
  "บอกว่าถ้าย้อนเวลาได้จะกลับไปแก้เรื่องอะไร ไม่ตอบโดนดื่ม",
  "ทายว่าใครในวงนี้จะรวยที่สุดในอนาคต ไม่ตอบโดนดื่ม",
  "ถ้าต้องติดเกาะร้างกับคนในวงนี้ 1 คนจะเลือกใคร ไม่ตอบโดนดื่ม",
  "เล่ามุกตลกที่ชอบที่สุด ไม่เล่าโดนดื่ม",
  "บอกครั้งล่าสุดที่แอบชอบใครคือเมื่อไหร่ ไม่ตอบโดนดื่ม",
  "บอกข้อดี 1 ข้อของคนขวามือ นึกไม่ออกโดนดื่ม",
];

const RC_DARE_PROMPTS = [
  "เต้นตามเพลงที่วงเลือกให้ 15 วินาที",
  "เลียนแบบท่าทางคนข้างๆ 10 วินาที",
  "พูดภาษาอังกฤษล้วน 1 รอบ ใครหลุดไทยโดนดื่ม",
  "ทำเสียงสัตว์ตามที่วงเลือกให้ 1 ครั้ง",
  "ไหว้ทุกคนในวงทีละคนพร้อมชม 1 ประโยค",
  "นั่งสลับที่กับคนขวามือ 1 รอบ",
  "ทำท่าตลกตามที่เพื่อนสั่ง 1 ท่า",
  "ร้องเพลงชาติท่อนแรก",
  "เล่นมุกตลก 1 มุกให้ทั้งวงฟัง",
  "ให้เพื่อนวาดรูปหน้าตัวเองแบบไม่มองกระดาษ",
  "โพสต์อิโมจิสุ่มลงกลุ่มแชทตามที่วงบอก",
  "ทำสีหน้าตามอารมณ์ที่วงสั่ง (ดีใจ/เศร้า/โกรธ)",
  "พูดชื่อเล่นตัวเองเป็นสำเนียงที่วงเลือกให้",
  "ให้คนขวามือจับมือทำนายดวง 10 วินาที",
  "ยืนพูดแนะนำตัวใหม่เหมือนเพิ่งเจอกันวันแรก",
];

const RC_MINIGAME_PROMPTS = [
  "มินิเกม: ผลัดกันบอกชื่ออาหารห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อจังหวัดในไทยห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อประเทศห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อสัตว์ห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อดาราหรือนักร้องห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ผลัดกันบอกชื่อผลไม้ห้ามซ้ำ ใครตันหรือซ้ำโดน",
  "มินิเกม: ต่อคำคล้องจอง ใครต่อไม่ได้โดน",
  "มินิเกม: นับเลข 1 ถึง 30 ห้ามพูดเลขที่หาร 3 ลงตัวให้ปรบมือแทน ใครพลาดโดน",
  "มินิเกม: เป่ายิงฉุบแพ้ติดกัน 2 ครั้งโดน",
  "มินิเกม: ทายคำจากใบ้ท่าทาง ใครทายไม่ออกภายใน 10 วินาทีโดน",
];

const RC_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const RC_COLORS = ["แดง","ส้ม","เหลือง","เขียว","ฟ้า","น้ำเงิน","ม่วง","ชมพู","ดำ","ขาว"];
const RC_THAI_ZODIAC = ["ชวด (หนู)","ฉลู (วัว)","ขาล (เสือ)","เถาะ (กระต่าย)","มะโรง (งูใหญ่)","มะเส็ง (งูเล็ก)","มะเมีย (ม้า)","มะแม (แพะ)","วอก (ลิง)","ระกา (ไก่)","จอ (หมา)","กุน (หมู)"];
const RC_WESTERN_ZODIAC = ["ราศีเมษ","ราศีพฤษภ","ราศีเมถุน","ราศีกรกฎ","ราศีสิงห์","ราศีกันย์","ราศีตุลย์","ราศีพิจิก","ราศีธนู","ราศีมังกร","ราศีกุมภ์","ราศีมีน"];
const RC_BLOOD_TYPES = ["A", "B", "AB", "O"];

function buildRcTemplatedPrompts() {
  const list = [];
  RC_MONTHS.forEach((m) => list.push(`คนที่เกิดเดือน${m}โดน`));
  RC_COLORS.forEach((c) => list.push(`คนที่ใส่เสื้อสี${c}โดน`));
  RC_THAI_ZODIAC.forEach((a) => list.push(`คนเกิดปีนักษัตร${a}โดน`));
  RC_WESTERN_ZODIAC.forEach((z) => list.push(`คน${z}โดน`));
  RC_BLOOD_TYPES.forEach((b) => list.push(`คนหมู่เลือด ${b} โดน`));
  for (let n = 1; n <= 10; n++) list.push(`คนที่นั่งลำดับที่ ${n} นับจากซ้ายมือโดน`);
  return list;
}

function buildRcBuiltInPool() {
  return [
    ...RC_CORE_PROMPTS,
    ...RC_CHALLENGE_PROMPTS,
    ...RC_SUPERLATIVE_PROMPTS,
    ...RC_TIMED_PROMPTS,
    ...RC_QUESTION_PROMPTS,
    ...RC_DARE_PROMPTS,
    ...RC_MINIGAME_PROMPTS,
    ...buildRcTemplatedPrompts(),
  ];
}

const RC_BUILTIN_POOL = buildRcBuiltInPool();
const RC_QUANTITY_OPTIONS = [20, 50, 100, "all"];

function buildRcDeck(quantity, custom, excluded) {
  const effectivePool = RC_BUILTIN_POOL.filter((item) => !excluded.includes(item));
  const shuffledPool = shuffleArray(effectivePool);
  const picked = quantity === "all" ? shuffledPool : shuffledPool.slice(0, Math.min(quantity, shuffledPool.length));
  return shuffleArray([...picked, ...custom]);
}

function rcRemoveFromPool(text, state) {
  const customIdx = state.rcCustom.indexOf(text);
  if (customIdx !== -1) {
    state.rcCustom.splice(customIdx, 1);
  } else if (!state.rcExcluded.includes(text)) {
    state.rcExcluded.push(text);
  }
  if (state.rcDeck) {
    state.rcDeck = state.rcDeck.filter((d) => d !== text);
  }
  saveWongLaoState(state);
}

function renderRandomCardGame(body, state) {
  if (state.rcStarted && state.rcDeck) {
    renderRcDrawScreen(body, state);
  } else {
    renderRcSetupScreen(body, state);
  }
}

function renderRcSetupScreen(body, state) {
  const builtInCount = RC_BUILTIN_POOL.length - state.rcExcluded.length;
  const totalCount = builtInCount + state.rcCustom.length;
  const listItems = [...RC_BUILTIN_POOL.filter((p) => !state.rcExcluded.includes(p)), ...state.rcCustom];

  body.innerHTML = `
    <div class="rc-setup">
      <div class="rc-total">มีบทลงโทษทั้งหมด ${totalCount} ใบ (${builtInCount} มาตรฐาน + ${state.rcCustom.length} ที่คุณเพิ่มเอง)</div>
      <button class="reset-btn" id="rcToggleList">${state.rcShowList ? "ซ่อนรายการ" : "ดูรายการทั้งหมด"}</button>
      ${
        state.rcExcluded.length > 0
          ? `<button class="reset-btn" id="rcRestoreBtn">กู้คืนรายการที่ลบ (${state.rcExcluded.length})</button>`
          : ""
      }
      ${
        state.rcShowList
          ? `<div class="rc-list">${listItems
              .map((p, i) => `<div class="rc-list-item"><span>${p}</span><button class="rc-list-del" data-i="${i}">×</button></div>`)
              .join("")}</div>`
          : ""
      }

      <div class="step-row">
        <div class="step-label">เลือกจำนวนใบในกอง</div>
        ${RC_QUANTITY_OPTIONS.map(
          (q) => `<button class="step-chip ${state.rcQuantity === q ? "active" : ""}" data-q="${q}">${q === "all" ? "ทั้งหมด" : q}</button>`
        ).join("")}
      </div>

      <div class="picker-input-row">
        <input type="text" id="rcCustomInput" placeholder="พิมพ์บทลงโทษของคุณเองแล้วกดเพิ่ม" />
        <button id="rcAddCustomBtn">เพิ่ม</button>
      </div>
      <div class="picker-list" id="rcCustomList"></div>

      <button class="wl-action-btn" id="rcStartBtn">เริ่มเปิดไพ่</button>
    </div>
  `;

  body.querySelector("#rcToggleList").addEventListener("click", () => {
    state.rcShowList = !state.rcShowList;
    saveWongLaoState(state);
    renderRcSetupScreen(body, state);
  });

  const restoreBtn = body.querySelector("#rcRestoreBtn");
  if (restoreBtn) {
    restoreBtn.addEventListener("click", () => {
      state.rcExcluded = [];
      saveWongLaoState(state);
      renderRcSetupScreen(body, state);
    });
  }

  body.querySelectorAll(".rc-list-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      rcRemoveFromPool(listItems[Number(btn.dataset.i)], state);
      renderRcSetupScreen(body, state);
    });
  });

  body.querySelectorAll(".step-chip[data-q]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.dataset.q === "all" ? "all" : Number(chip.dataset.q);
      state.rcQuantity = q;
      saveWongLaoState(state);
      renderRcSetupScreen(body, state);
    });
  });

  const customList = body.querySelector("#rcCustomList");
  state.rcCustom.forEach((text, i) => {
    const chip = document.createElement("div");
    chip.className = "name-chip";
    chip.innerHTML = `<span>${text}</span><button data-i="${i}">×</button>`;
    customList.appendChild(chip);
  });
  customList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.rcCustom.splice(Number(btn.dataset.i), 1);
      saveWongLaoState(state);
      renderRcSetupScreen(body, state);
    });
  });

  body.querySelector("#rcAddCustomBtn").addEventListener("click", () => {
    const input = body.querySelector("#rcCustomInput");
    const val = input.value.trim();
    if (!val) return;
    state.rcCustom.push(val);
    saveWongLaoState(state);
    renderRcSetupScreen(body, state);
  });
  body.querySelector("#rcCustomInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") body.querySelector("#rcAddCustomBtn").click();
  });

  body.querySelector("#rcStartBtn").addEventListener("click", () => {
    state.rcDeck = buildRcDeck(state.rcQuantity, state.rcCustom, state.rcExcluded);
    state.rcLast = null;
    state.rcStarted = true;
    saveWongLaoState(state);
    renderRcDrawScreen(body, state);
  });
}

function renderRcDrawScreen(body, state) {
  const deckEmpty = state.rcDeck.length === 0;

  body.innerHTML = `
    <div class="rc-draw">
      <div class="rc-count">เหลือ ${state.rcDeck.length} ใบ</div>
      <div class="rc-card ${state.rcLast ? "" : "empty"}">
        <span class="rc-card-text">${state.rcLast || "🎴"}</span>
      </div>
      <button class="wl-action-btn" id="rcDrawBtn" ${deckEmpty ? "disabled" : ""}>เปิดไพ่</button>
      <div class="rc-draw-actions">
        <button class="reset-btn" id="rcReshuffleBtn">สับไพ่ใหม่</button>
        <button class="reset-btn" id="rcDeleteBtn" ${state.rcLast ? "" : "disabled"}>ลบใบนี้ทิ้ง</button>
        <button class="reset-btn" id="rcSettingsBtn">ตั้งค่า</button>
      </div>
    </div>
  `;

  body.querySelector("#rcDrawBtn").addEventListener("click", () => {
    state.rcLast = state.rcDeck.pop();
    saveWongLaoState(state);
    renderRcDrawScreen(body, state);
    showRcOverlay(state.rcLast);
  });

  body.querySelector("#rcReshuffleBtn").addEventListener("click", () => {
    state.rcDeck = buildRcDeck(state.rcQuantity, state.rcCustom, state.rcExcluded);
    state.rcLast = null;
    saveWongLaoState(state);
    renderRcDrawScreen(body, state);
  });

  body.querySelector("#rcDeleteBtn").addEventListener("click", () => {
    if (!state.rcLast) return;
    rcRemoveFromPool(state.rcLast, state);
    state.rcLast = null;
    saveWongLaoState(state);
    renderRcDrawScreen(body, state);
  });

  body.querySelector("#rcSettingsBtn").addEventListener("click", () => {
    state.rcStarted = false;
    saveWongLaoState(state);
    renderRcSetupScreen(body, state);
  });
}

function showRcOverlay(text) {
  const overlay = document.createElement("div");
  overlay.className = "rc-overlay";
  overlay.innerHTML = `
    <div class="rc-overlay-card"><span>${text}</span></div>
    <div class="rc-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
