// ไพ่ Ohana — depends on saveWongLaoState (tools/wonglao-core.js, must load first)

const OHANA_SUITS = ["♠", "♥", "♦", "♣"];
const OHANA_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const OHANA_RULES = {
  A: "ดื่มคนเดียว",
  2: "ดื่มเอง แล้วหาอีก 1 คนดื่มด้วย",
  3: "ดื่มเอง แล้วหาอีก 2 คนดื่มด้วย",
  4: "คนทางซ้ายของคนจั่วดื่ม",
  5: "ทุกคนดื่ม",
  6: "คนทางขวาของคนจั่วดื่ม",
  7: "เล่นมินิเกมกัน",
  8: "พัก 1 ยก",
  9: "เล่นมินิเกม (เหมือน 7)",
  10: "ทาแป้ง",
  J: "จับหน้า",
  Q: "แหม่ม ห้ามใครคุยด้วย",
  K: "สร้างกฎ ทำตามที่ตกลงกัน",
};

function buildOhanaDeck() {
  const deck = [];
  for (const suit of OHANA_SUITS) {
    for (const rank of OHANA_RANKS) {
      deck.push(rank + suit);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function renderOhanaGame(body, state) {
  if (!state.ohanaDeck || !state.ohanaDeck.length) {
    if (!state.ohanaDeck) {
      state.ohanaDeck = buildOhanaDeck();
      saveWongLaoState(state);
    }
  }

  function draw() {
    const last = state.ohanaLast;
    const rank = last ? last.slice(0, -1) : null;
    const suit = last ? last.slice(-1) : null;
    const isRed = suit === "♥" || suit === "♦";
    const deckEmpty = state.ohanaDeck.length === 0;

    body.innerHTML = `
      <div class="ohana-wrap">
        <div class="ohana-count">เหลือ ${state.ohanaDeck.length} ใบ</div>
        <div class="ohana-card ${last ? (isRed ? "red" : "") : "empty"}">
          ${last ? `<span class="ohana-rank">${rank}</span><span class="ohana-suit">${suit}</span>` : "🃏"}
        </div>
        <div class="ohana-rule" id="ohanaRule">${last ? OHANA_RULES[rank] : "กดจั่วไพ่เพื่อเริ่ม"}</div>
        <button class="wl-action-btn" id="drawCardBtn" ${deckEmpty ? "disabled" : ""}>จั่วไพ่</button>
        <button class="reset-btn" id="reshuffleBtn">${deckEmpty ? "สับไพ่ใหม่ (ครบ 52 ใบ)" : "สับไพ่ใหม่"}</button>
      </div>
    `;

    body.querySelector("#drawCardBtn").addEventListener("click", () => {
      state.ohanaLast = state.ohanaDeck.pop();
      saveWongLaoState(state);
      draw();
      const newRank = state.ohanaLast.slice(0, -1);
      const newSuit = state.ohanaLast.slice(-1);
      const newIsRed = newSuit === "♥" || newSuit === "♦";
      showOhanaOverlay(newRank, newSuit, newIsRed, OHANA_RULES[newRank]);
    });

    body.querySelector("#reshuffleBtn").addEventListener("click", () => {
      state.ohanaDeck = buildOhanaDeck();
      state.ohanaLast = null;
      saveWongLaoState(state);
      draw();
    });
  }

  draw();
}

function showOhanaOverlay(rank, suit, isRed, ruleText) {
  const overlay = document.createElement("div");
  overlay.className = "ohana-overlay";
  overlay.innerHTML = `
    <div class="ohana-overlay-card ${isRed ? "red" : ""}">
      <span class="ohana-rank">${rank}</span>
      <span class="ohana-suit">${suit}</span>
    </div>
    <div class="ohana-overlay-rule">${ruleText}</div>
    <div class="ohana-overlay-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
