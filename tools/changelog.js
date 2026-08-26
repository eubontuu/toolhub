// การอัปเดต (changelog) — no dependency on other tool files
// เพิ่มรายการใหม่ไว้ "บนสุด" ของ CHANGELOG_DATA ทุกครั้งที่ ship อะไรที่ผู้ใช้ควรรู้
// (ฟีเจอร์ใหม่ / แก้บั๊กที่เห็นผล / เอาอะไรออก) — เขียนเป็นภาษาไทยสั้นๆ

const CHANGELOG_TAG_LABEL = { added: "เพิ่ม", changed: "แก้ไข", removed: "ลบ" };

const CHANGELOG_DATA = [
  {
    version: "v26",
    date: "26 ส.ค. 2569",
    items: [
      { type: "changed", text: "ย้ายปุ่มดูประวัติในเครื่องมือ บวก/ลบ ไปเป็นไอคอน 🕘 มุมขวาบน กดดูเป็นแผงลอยแทนรายการที่ต้องเลื่อนหา" },
    ],
  },
  {
    version: "v25",
    date: "26 ส.ค. 2569",
    items: [
      { type: "added", text: "เครื่องมือ บวก/ลบ เก็บประวัติทุกครั้งที่กดบวก/ลบ พร้อมเวลา ลบทีละรายการหรือลบทั้งหมดได้ (ลบทั้งหมดต้องยืนยันก่อน)" },
    ],
  },
  {
    version: "v24",
    date: "26 ส.ค. 2569",
    items: [
      { type: "changed", text: "เปลี่ยนไอคอนแอป (หน้าจอโฮม) เป็นรูปหมู 🐷" },
    ],
  },
  {
    version: "v23",
    date: "26 ส.ค. 2569",
    items: [
      { type: "changed", text: "ตกแต่งหัวข้อหน้าแรกใหม่ — การ์ดพื้นหลัง เส้นขอบสีชมพู ตัวอักษรไล่สี และไอคอนหมู 🐷" },
    ],
  },
  {
    version: "v21",
    date: "26 ส.ค. 2569",
    items: [
      { type: "changed", text: "เปลี่ยนชื่อหน้าแรกเป็น \"คลังแสงของ หมูอุ๊ด\" และข้อความต้อนรับใหม่" },
    ],
  },
  {
    version: "v20",
    date: "26 ส.ค. 2569",
    items: [
      { type: "changed", text: "จัดโครงสร้าง CSS ใหม่เหมือนกับโค้ด JS — แยกเป็นไฟล์ย่อยต่อเครื่องมือ ไม่กระทบหน้าตาแอป" },
    ],
  },
  {
    version: "v19",
    date: "26 ส.ค. 2569",
    items: [
      { type: "added", text: "เพิ่มหน้านี้ — หน้าดูประวัติการอัปเดตของแอป (กดไอคอน 🕘 มุมขวาบนของหน้าแรก)" },
    ],
  },
  {
    version: "v18",
    date: "26 ส.ค. 2569",
    items: [
      { type: "changed", text: "จัดโครงสร้างไฟล์เบื้องหลังใหม่ แยกโค้ดเป็นไฟล์ย่อยต่อเครื่องมือ — ไม่กระทบการใช้งาน แค่ทำให้แก้ไข/พัฒนาต่อได้เร็วขึ้น" },
    ],
  },
  {
    version: "v16–v17",
    date: "24 ส.ค. 2569",
    items: [
      { type: "added", text: "ทดลองเพิ่มเครื่องมือสุ่มสีในหน้าแรก" },
      { type: "removed", text: "ถอดเครื่องมือสุ่มสีออก (เป็นแค่การทดสอบระบบ)" },
    ],
  },
  {
    version: "v15",
    date: "24 ส.ค. 2569",
    items: [
      { type: "changed", text: "ปรับจำนวนครั้ง/เซตในโปรแกรมเตรียมเดินป่าให้บาลานซ์มากขึ้น (เติมสัปดาห์ 4-6 และท่า core ของสัปดาห์ 2 ที่ขาดไป)" },
    ],
  },
  {
    version: "v14",
    date: "24 ส.ค. 2569",
    items: [
      { type: "added", text: "กดลบรายการที่ไม่ต้องการได้ใน ไพ่สุ่ม" },
      { type: "added", text: "เปิดไพ่แบบเต็มจอใน ไพ่สุ่ม (เหมือน ไพ่ Ohana)" },
    ],
  },
  {
    version: "v13",
    date: "24 ส.ค. 2569",
    items: [
      { type: "removed", text: "ระบบแจ้งเตือนผ่าน Web Push จากตัวแอปโดยตรง (ติดข้อจำกัดของเครือข่ายฝั่งระบบ)" },
      { type: "changed", text: "เปลี่ยนการแจ้งเตือนเตรียมเดินป่าไปใช้ผ่าน Claude แทน" },
    ],
  },
  {
    version: "v12",
    date: "24 ส.ค. 2569",
    items: [
      { type: "added", text: "ระบบแจ้งเตือน Web Push จากตัวแอปโดยตรง (ภายหลังถูกถอดออกใน v13)" },
    ],
  },
  {
    version: "v11",
    date: "24 ส.ค. 2569",
    items: [
      { type: "changed", text: "จัดหน้าเมนู วงเหล้า ใหม่เป็นกริดไอคอน แทนแถบแท็บ 6 ช่องที่แน่นเกินไป" },
    ],
  },
  {
    version: "v10",
    date: "24 ส.ค. 2569",
    items: [
      { type: "added", text: "เครื่องมือ เตรียมเดินป่า (ตารางฝึก 6 สัปดาห์ + เช็คลิสต์รายวัน)" },
    ],
  },
  {
    version: "v9",
    date: "24 ส.ค. 2569",
    items: [
      { type: "added", text: "เกม ไพ่สุ่ม, วงล้อ, Chwazi, Flash Quiz ในวงเหล้า" },
      { type: "added", text: "เปิดไพ่ Ohana แบบเต็มจอ" },
      { type: "changed", text: "แก้บั๊กเลย์เอาต์ที่ทำให้บางหน้าจอไม่เต็มพื้นที่" },
    ],
  },
  {
    version: "v5",
    date: "24 ส.ค. 2569",
    items: [
      { type: "changed", text: "เปลี่ยนจากลูกเต๋า/เป่ายิงฉุบ เป็นเกมไพ่ Ohana (เกมดื่มไพ่ 52 ใบ)" },
    ],
  },
  {
    version: "v4",
    date: "24 ส.ค. 2569",
    items: [
      { type: "added", text: "เครื่องมือ วงเหล้า ชุดแรก (ลูกเต๋า, สุ่มคน, เป่ายิงฉุบ)" },
    ],
  },
  {
    version: "v3",
    date: "24 ส.ค. 2569",
    items: [
      { type: "added", text: "เปิดตัว ToolHub ครั้งแรก พร้อมเครื่องมือ บวก/ลบ" },
    ],
  },
];

function renderChangelog(container) {
  const groups = [];
  let lastDate = null;
  CHANGELOG_DATA.forEach((entry) => {
    if (entry.date !== lastDate) {
      groups.push({ date: entry.date, entries: [] });
      lastDate = entry.date;
    }
    groups[groups.length - 1].entries.push(entry);
  });

  container.innerHTML = `
    <div class="changelog-wrap">
      ${groups
        .map(
          (g) => `
        <div class="changelog-day-label">${g.date}</div>
        ${g.entries
          .map(
            (e) => `
          <div class="changelog-entry">
            <div class="changelog-head">
              <span class="changelog-version">${e.version}</span>
            </div>
            <ul class="changelog-list">
              ${e.items
                .map(
                  (it) =>
                    `<li><span class="cl-tag ${it.type}">${CHANGELOG_TAG_LABEL[it.type]}</span>${it.text}</li>`
                )
                .join("")}
            </ul>
          </div>
        `
          )
          .join("")}
      `
        )
        .join("")}
    </div>
  `;
}
