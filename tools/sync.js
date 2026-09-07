// เชื่อมอุปกรณ์ (multi-device sync) — เสริมทางเลือก ไม่บังคับ, ปิดอยู่โดยดีฟอลต์ (ไม่มี toolhub.sync.code
// ในเครื่อง = ไม่แตะเน็ตเวิร์กเลย). แนวคิด: ไม่มีระบบ login/account จริง — ใช้ "รหัส sync" ตัวเดียวที่
// พิมพ์เหมือนกันในทุกเครื่องแทน ทุกเครื่องที่รู้รหัสเดียวกันจะอ่าน/เขียนข้อมูลก้อนเดียวกันใน Firestore
// (ผ่าน Firebase Anonymous Auth เพื่อผ่าน security rules — ไม่ใช่ตัวยืนยันตัวตนจริง). ความปลอดภัยเลย
// ขึ้นกับความลับของรหัส ไม่ใช่บัญชีผู้ใช้ — ห้ามแชร์รหัสให้คนอื่น.
//
// กลไก: patch localStorage.setItem ทั้งแอปให้ทุกครั้งที่คีย์ไหนขึ้นต้นด้วย "toolhub." ถูกเซฟ จะคิว
// push ขึ้น Firestore (debounced) แบบไม่ต้องแก้โค้ดของแต่ละเครื่องมือเลย — ตอนบูตแอป (ToolHubSync.ready(),
// เรียกจาก app.js ก่อน render() ครั้งแรก) จะ pull ข้อมูลทั้งหมดของรหัสนี้ลงมาทับ localStorage ก่อน (มี
// timeout กันค้างตอนออฟไลน์). งานที่ push ไม่สำเร็จ (ออฟไลน์ตอนนั้น) จะถูกจำไว้ใน toolhub.sync.pending
// แล้วลองใหม่ตอนบูต/กด "ซิงค์เดี๋ยวนี้" รอบถัดไป.
//
// Real-time: เชื่อมอยู่ก็เปิด onSnapshot listener ค้างไว้ (startLiveListener) — ข้อมูลใหม่จากเครื่องอื่น
// จะเขียนลง localStorage ทันทีเสมอ (ไม่มีทางหาย) แต่จะ "แสดงผล" (เรียก render() ให้เลย) เฉพาะตอนไม่ได้
// กำลังยุ่งอยู่ (isUserBusy() — โฟกัสอยู่ที่ input/textarea, หรือมี reveal-overlay เปิดอยู่) กันไม่ให้
// สิ่งที่กำลังพิมพ์ค้างหายไปเพราะจอรีเฟรชกะทันหัน; ถ้ากำลังยุ่งอยู่จะขึ้นแถบเล็กๆ ให้แตะอัปเดตเองแทน
// (showLiveUpdateBanner). ข้ามการ apply snapshot ที่มาจาก write ของตัวเองอยู่ (metadata.hasPendingWrites)
// กันวนลูป/re-render ตัวเองตอนเพิ่ง push เสร็จ.
//
// Chunking: Firestore จำกัด 1 MiB ต่อ document แต่ค่าเดียวใน localStorage โตเกินนั้นได้จริง (ความทรงจำ
// เก็บรูป base64 รวมไว้ในคีย์เดียว) — ค่าที่ยาวเกิน SYNC_CHUNK_SIZE เลยถูกหั่นเป็นหลาย document
// (`<key>::part<i>`) แล้วเอา document ตัวหลักเก็บ "ตัวชี้" ว่ามีกี่ชิ้น (SYNC_CHUNK_MARKER + จำนวน).
// ลำดับการเขียนสำคัญ: เขียน marker เป็น 0 ก่อน (= ยังไม่สมบูรณ์ อย่าเพิ่งใช้) → เขียนชิ้นส่วนทั้งหมด →
// ค่อยเขียน marker ตัวจริง ถ้าเน็ตหลุดกลางคัน ฝั่ง pull จะข้ามคีย์นั้นไปเลยแทนที่จะประกอบข้อมูลพัง.
// การหั่นนี้ generic ล้วน — sync ไม่รู้จักโครงสร้างข้อมูลของเครื่องมือไหนเลย เครื่องมือใหม่ที่เก็บของใหญ่
// ก็ได้ผลเหมือนกันโดยไม่ต้องแก้อะไร.

const SYNC_CODE_KEY = "toolhub.sync.code";
const SYNC_PENDING_KEY = "toolhub.sync.pending";
const SYNC_OWN_KEYS = new Set([SYNC_CODE_KEY, SYNC_PENDING_KEY]);
const SYNC_KEY_PREFIX = "toolhub.";
const SYNC_PULL_TIMEOUT_MS = 4000;
const SYNC_PUSH_DEBOUNCE_MS = 900;
const SYNC_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // ไม่มี 0/O, 1/I/L กันอ่านผิด
const SYNC_CODE_LEN = 10;
// 250k ตัวอักษร: ต่อให้เป็นภาษาไทยล้วน (3 ไบต์/ตัวใน UTF-8) ก็ยัง ~750KB ไม่ชนเพดาน 1 MiB ของ Firestore
// และไม่ชนเงื่อนไข value.size() < 900000 ใน security rules ด้วย
const SYNC_CHUNK_SIZE = 250000;
const SYNC_CHUNK_MARKER = "__TOOLHUB_CHUNKED__:";
const SYNC_PART_SEP = "::part";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDjJjQRPDqfIe0g83G43fhtTyuOiJYwGLM",
  authDomain: "data-56b12.firebaseapp.com",
  projectId: "data-56b12",
  storageBucket: "data-56b12.firebasestorage.app",
  messagingSenderId: "675209425669",
  appId: "1:675209425669:web:e1f8b5470ef54cf8e6fd6c",
};
const FIREBASE_SDK_VERSION = "10.13.2";
const FIREBASE_SDK_URLS = [
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js`,
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth-compat.js`,
  `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore-compat.js`,
];

const nativeSetItem = localStorage.setItem.bind(localStorage);

// โหลด Firebase SDK แบบ dynamic เฉพาะตอนใช้จริง (มีรหัส sync แล้ว หรือกำลังจะเชื่อม) — คนที่ไม่ใช้ฟีเจอร์นี้
// จะไม่โดนโหลดสคริปต์เพิ่มเลยแม้แต่ไบต์เดียว.
let firebaseSdkPromise = null;
function loadFirebaseSdk() {
  if (typeof firebase !== "undefined") return Promise.resolve();
  if (firebaseSdkPromise) return firebaseSdkPromise;
  firebaseSdkPromise = FIREBASE_SDK_URLS.reduce(
    (chain, url) =>
      chain.then(
        () =>
          new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.src = url;
            s.onload = resolve;
            s.onerror = () => reject(new Error("โหลด Firebase SDK ไม่สำเร็จ"));
            document.head.appendChild(s);
          })
      ),
    Promise.resolve()
  );
  return firebaseSdkPromise;
}

let firebaseApp = null;
let firestoreDb = null;
let authUserPromise = null;

async function firebaseReady() {
  await loadFirebaseSdk();
  if (!firebaseApp) {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firestoreDb = firebase.firestore();
  }
  if (!authUserPromise) {
    authUserPromise = new Promise((resolve) => {
      const unsub = firebase.auth().onAuthStateChanged((user) => {
        unsub();
        if (user) {
          resolve(user);
        } else {
          firebase
            .auth()
            .signInAnonymously()
            .then((cred) => resolve(cred.user))
            .catch(() => resolve(null));
        }
      });
    });
  }
  const user = await authUserPromise;
  if (!user) throw new Error("เข้าสู่ระบบไม่สำเร็จ");
  return user;
}

function loadSyncCode() {
  try {
    return localStorage.getItem(SYNC_CODE_KEY) || null;
  } catch (e) {
    return null;
  }
}

function loadPending() {
  try {
    const raw = localStorage.getItem(SYNC_PENDING_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function savePending(list) {
  try {
    nativeSetItem(SYNC_PENDING_KEY, JSON.stringify(list));
  } catch (e) {}
}

function markPending(key) {
  const list = loadPending();
  if (!list.includes(key)) {
    list.push(key);
    savePending(list);
  }
}

function clearPending(key) {
  const list = loadPending();
  const next = list.filter((k) => k !== key);
  if (next.length !== list.length) savePending(next);
}

function syncableKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(SYNC_KEY_PREFIX) && !SYNC_OWN_KEYS.has(k)) keys.push(k);
    }
  } catch (e) {}
  return keys;
}

function docRef(code, key) {
  return firestoreDb.collection("syncCodes").doc(code).collection("data").doc(key);
}

const pushTimers = {};

function queuePush(key) {
  const code = loadSyncCode();
  if (!code || SYNC_OWN_KEYS.has(key) || !key.startsWith(SYNC_KEY_PREFIX)) return;
  markPending(key);
  clearTimeout(pushTimers[key]);
  pushTimers[key] = setTimeout(() => attemptPush(code, key), SYNC_PUSH_DEBOUNCE_MS);
}

let lastSyncError = null;

function stamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

async function attemptPush(code, key) {
  try {
    await firebaseReady();
    const raw = localStorage.getItem(key);
    if (raw === null) {
      clearPending(key);
      return;
    }
    if (raw.length > SYNC_CHUNK_SIZE) {
      // marker = 0 ก่อน: ระหว่างนี้เครื่องอื่นที่ pull จะข้ามคีย์นี้ไป ไม่หยิบข้อมูลครึ่งๆ กลางๆ ไปใช้
      await docRef(code, key).set({ value: SYNC_CHUNK_MARKER + "0", updatedAt: stamp() });
      const parts = [];
      for (let i = 0; i < raw.length; i += SYNC_CHUNK_SIZE) parts.push(raw.slice(i, i + SYNC_CHUNK_SIZE));
      for (let i = 0; i < parts.length; i++) {
        await docRef(code, key + SYNC_PART_SEP + i).set({ value: parts[i], updatedAt: stamp() });
      }
      await docRef(code, key).set({ value: SYNC_CHUNK_MARKER + parts.length, updatedAt: stamp() });
    } else {
      await docRef(code, key).set({ value: raw, updatedAt: stamp() });
    }
    clearPending(key);
    lastSyncError = null;
  } catch (e) {
    // ยังไม่สำเร็จ (ออฟไลน์/บล็อก) — ค้างไว้ใน pending รอ ready()/pullNow() รอบถัดไปลองใหม่
    lastSyncError = (e && e.message) || "ซิงค์ไม่สำเร็จ";
  }
}

async function flushPending(code) {
  for (const key of loadPending()) {
    await attemptPush(code, key);
  }
}

// ประกอบ QuerySnapshot (จาก .get() ครั้งเดียว หรือ onSnapshot ต่อเนื่อง — หน้าตาเหมือนกัน) กลับเป็น
// Map(key -> ค่าเต็ม) — คีย์ไหนที่ชิ้นส่วนขาด (อัปโหลดค้างกลางคัน) จะถูกข้ามทั้งคีย์ ดีกว่าเขียนข้อมูล
// ที่ประกอบไม่ครบทับของเดิมในเครื่อง
function reassembleSnapshot(snap) {
  const mains = new Map();
  const parts = new Map();
  snap.forEach((doc) => {
    const id = doc.id;
    const { value } = doc.data();
    if (typeof value !== "string") return;
    const sepAt = id.lastIndexOf(SYNC_PART_SEP);
    if (sepAt !== -1) {
      const baseKey = id.slice(0, sepAt);
      const idx = Number(id.slice(sepAt + SYNC_PART_SEP.length));
      if (!Number.isInteger(idx)) return;
      if (!parts.has(baseKey)) parts.set(baseKey, new Map());
      parts.get(baseKey).set(idx, value);
      return;
    }
    mains.set(id, value);
  });

  const out = new Map();
  mains.forEach((value, key) => {
    if (!key.startsWith(SYNC_KEY_PREFIX) || SYNC_OWN_KEYS.has(key)) return;
    if (!value.startsWith(SYNC_CHUNK_MARKER)) {
      out.set(key, value);
      return;
    }
    const count = Number(value.slice(SYNC_CHUNK_MARKER.length));
    if (!Number.isInteger(count) || count < 1) return; // 0 = กำลังเขียนอยู่ ยังไม่สมบูรณ์
    const bucket = parts.get(key);
    if (!bucket) return;
    let joined = "";
    for (let i = 0; i < count; i++) {
      const piece = bucket.get(i);
      if (typeof piece !== "string") return; // ชิ้นส่วนขาด — ข้ามคีย์นี้ไปทั้งอัน
      joined += piece;
    }
    out.set(key, joined);
  });
  return out;
}

async function fetchAll(code) {
  await firebaseReady();
  const snap = await firestoreDb.collection("syncCodes").doc(code).collection("data").get();
  return reassembleSnapshot(snap);
}

async function pullAll(code) {
  const values = await fetchAll(code);
  values.forEach((value, key) => {
    try {
      nativeSetItem(key, value);
    } catch (e) {
      // localStorage เต็ม — ข้อมูลบนคลาวด์ใหญ่กว่าที่เครื่องนี้เก็บไหว
      lastSyncError = "พื้นที่ในเครื่องเต็ม เก็บข้อมูลที่ดึงมาไม่ครบ";
    }
  });
}

// ---------- real-time ----------

let liveUnsubscribe = null;
let liveBannerEl = null;

function isUserBusy() {
  const el = document.activeElement;
  const tag = el && el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el && el.isContentEditable)) return true;
  if (document.querySelector(".reveal-overlay.show")) return true;
  return false;
}

function showLiveUpdateBanner() {
  if (liveBannerEl) return; // ขึ้นอยู่แล้ว ไม่ต้องซ้อน
  liveBannerEl = document.createElement("button");
  liveBannerEl.type = "button";
  liveBannerEl.className = "sync-live-banner";
  liveBannerEl.textContent = "🔄 มีข้อมูลใหม่จากอีกเครื่อง — แตะเพื่ออัปเดต";
  liveBannerEl.addEventListener("click", () => {
    hideLiveUpdateBanner();
    if (typeof render === "function") render();
  });
  document.body.appendChild(liveBannerEl);
  void liveBannerEl.offsetHeight;
  liveBannerEl.classList.add("show");
}

function hideLiveUpdateBanner() {
  if (!liveBannerEl) return;
  liveBannerEl.remove();
  liveBannerEl = null;
}

async function startLiveListener(code) {
  if (liveUnsubscribe) return;
  try {
    await firebaseReady(); // ready() อาจเรียกมาตอน pull ยัง timeout อยู่ — firestoreDb ยังไม่ถูก init ก็ได้
  } catch (e) {
    return;
  }
  if (liveUnsubscribe || loadSyncCode() !== code) return; // เผื่อโดนเรียกซ้อน หรือ unlink ไปแล้วระหว่างรอ
  liveUnsubscribe = firestoreDb
    .collection("syncCodes")
    .doc(code)
    .collection("data")
    .onSnapshot(
      (snap) => {
        // snapshot ที่สะท้อน write ของเราเองที่ยังไม่ยืนยันจาก server — ข้าม กันวนลูป/re-render ตัวเอง
        if (snap.metadata.hasPendingWrites) return;
        const values = reassembleSnapshot(snap);
        let changed = false;
        values.forEach((value, key) => {
          if (localStorage.getItem(key) === value) return;
          try {
            nativeSetItem(key, value);
            changed = true;
          } catch (e) {
            lastSyncError = "พื้นที่ในเครื่องเต็ม เก็บข้อมูลที่ดึงมาไม่ครบ";
          }
        });
        if (!changed) return;
        if (isUserBusy()) {
          showLiveUpdateBanner();
        } else if (typeof render === "function") {
          render();
        }
      },
      () => {
        // listener ล่ม (เน็ต/สิทธิ์) — เงียบไว้ ยังมี pull ตอนบูต/ปุ่ม "ซิงค์เดี๋ยวนี้" เป็น fallback อยู่
      }
    );
}

function stopLiveListener() {
  if (liveUnsubscribe) {
    liveUnsubscribe();
    liveUnsubscribe = null;
  }
  hideLiveUpdateBanner();
}

function generateSyncCode() {
  const arr = new Uint32Array(SYNC_CODE_LEN);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < SYNC_CODE_LEN; i++) out += SYNC_CODE_ALPHABET[arr[i] % SYNC_CODE_ALPHABET.length];
  return out;
}

// patch: ทุก setItem ที่เกิดขึ้นทั้งแอป (ทุกเครื่องมือ) จะโดนคิว push อัตโนมัติถ้าเชื่อม sync อยู่ —
// ไม่ต้องแก้ save*State() ของแต่ละเครื่องมือเลยสักไฟล์
localStorage.setItem = function (key, value) {
  nativeSetItem(key, value);
  queuePush(key);
};

const ToolHubSync = {
  isLinked() {
    return !!loadSyncCode();
  },
  getCode() {
    return loadSyncCode();
  },
  // จำนวนคีย์ที่ push ค้างอยู่ (>0 = มีอะไรยังไม่ขึ้นคลาวด์) + ข้อความ error ล่าสุด — ใช้โชว์สถานะใน UI
  // แทนที่จะล้มเหลวเงียบๆ
  pendingCount() {
    return loadPending().length;
  },
  lastError() {
    return lastSyncError;
  },
  // เรียกตอนบูตแอปก่อน render() ครั้งแรก — ไม่ทำอะไรเลยถ้ายังไม่เคยเชื่อม (ไม่แตะเน็ตเวิร์ก)
  async ready() {
    const code = loadSyncCode();
    if (!code) return;
    // ดันของที่ค้างจากรอบก่อนขึ้นก่อนเสมอ (เช่นปิดแอปก่อน debounced push จะทัน) — ต้องทำก่อน pullAll
    // ด้านล่างเสมอ ไม่งั้น pull จะทับข้อมูลที่เพิ่งแก้ในเครื่องด้วยค่าเก่าจากคลาวด์ ก่อนที่ flush จะมี
    // โอกาสส่งค่าที่ถูกต้องขึ้นไปด้วยซ้ำ (แก้ไขจากรายงานจริง: แก้ to-do แล้วปิดแอปเร็ว เปิดใหม่ข้อมูลหาย)
    await Promise.race([
      flushPending(code).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, SYNC_PULL_TIMEOUT_MS)),
    ]);
    await Promise.race([
      pullAll(code).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, SYNC_PULL_TIMEOUT_MS)),
    ]);
    startLiveListener(code);
  },
  // สร้างรหัสใหม่ + เชื่อมด้วยรหัสนั้นทันที (อุปกรณ์แรกที่ "สร้าง" — ยังไม่มีข้อมูลบนคลาวด์ก่อนหน้า)
  async createAndLink() {
    const code = generateSyncCode();
    await this.link(code);
    return code;
  },
  // เชื่อมด้วยรหัสที่มีอยู่แล้ว (อุปกรณ์ถัดไปที่ทยอยกรอกรหัสเดียวกัน) — ข้อมูลบนคลาวด์ (ถ้ามี) จะทับ
  // ข้อมูลเครื่องนี้สำหรับคีย์ที่ชนกัน ส่วนคีย์ที่มีแต่ในเครื่องนี้ (คลาวด์ยังไม่มี) จะถูก push ขึ้นไปเติม
  async link(code) {
    nativeSetItem(SYNC_CODE_KEY, code);
    const values = await fetchAll(code);
    values.forEach((value, key) => {
      try {
        nativeSetItem(key, value);
      } catch (e) {
        lastSyncError = "พื้นที่ในเครื่องเต็ม เก็บข้อมูลที่ดึงมาไม่ครบ";
      }
    });
    syncableKeys()
      .filter((k) => !values.has(k))
      .forEach((k) => queuePush(k));
    startLiveListener(code);
  },
  // ข้อมูลผูกกับรหัสที่เชื่อมอยู่เท่านั้น — เลิกเชื่อมแล้วล้างข้อมูลในเครื่องนี้เสมอ (ไม่มีทางเหลือ
  // ข้อมูลค้างจากรหัสเก่าไว้ปนกับรหัสถัดไปที่จะเชื่อม) ข้อมูลบนคลาวด์ของรหัสเดิมไม่ถูกลบ ยังกลับมาเชื่อม
  // รหัสเดิมได้ตามปกติถ้าจำรหัสได้ — แอปยังใช้งานได้ตามปกติทั้งหมดหลังล้าง (แค่กลับไปเป็นค่าเริ่มต้นว่าง
  // เหมือนติดตั้งใหม่ ไม่ต้องเชื่อม sync ก็ใช้ต่อได้)
  unlink() {
    stopLiveListener();
    try {
      syncableKeys().forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem(SYNC_CODE_KEY);
      localStorage.removeItem(SYNC_PENDING_KEY);
    } catch (e) {}
  },
  // ปุ่ม "ซิงค์เดี๋ยวนี้" — ดึงข้อมูลล่าสุดจากคลาวด์ + ลอง push งานที่ค้างอีกครั้ง
  async pullNow() {
    const code = loadSyncCode();
    if (!code) return;
    await flushPending(code); // เหมือน ready() — ส่งของค้างขึ้นก่อนเสมอ กัน pull ทับของที่เพิ่งแก้
    await pullAll(code);
  },
};

window.ToolHubSync = ToolHubSync;

// ---------- UI: แผงเชื่อมอุปกรณ์ (เปิดจากปุ่มใน sidebar) ----------

function syncPanelBodyHtml() {
  const code = ToolHubSync.getCode();
  if (code) {
    const pending = ToolHubSync.pendingCount();
    const err = ToolHubSync.lastError();
    return `
      <div class="sync-status linked">🔗 เชื่อมอยู่</div>
      <div class="sync-code-display">${code}</div>
      <div class="sync-caption">กรอกรหัสนี้ในเครื่องอื่นเพื่อเชื่อมข้อมูลเข้าด้วยกัน ห้ามแชร์ให้คนอื่น</div>
      ${
        pending
          ? `<div class="sync-warn">⚠️ มี ${pending} รายการยังไม่ได้ขึ้นคลาวด์${
              err ? `<br><span class="sync-warn-detail">(${err})</span>` : ""
            }<br>กด "ซิงค์เดี๋ยวนี้" เพื่อลองใหม่</div>`
          : `<div class="sync-ok">✓ ข้อมูลขึ้นคลาวด์ครบแล้ว</div>`
      }
      <button class="sync-secondary-btn" id="syncCopyBtn">คัดลอกรหัส</button>
      <button class="sync-secondary-btn" id="syncNowBtn">ซิงค์เดี๋ยวนี้</button>
      <button class="sync-danger-btn" id="syncUnlinkBtn">เลิกเชื่อม (ล้างข้อมูลในเครื่องนี้)</button>
      <div class="sync-msg" id="syncMsg"></div>
    `;
  }
  return `
    <div class="sync-status">ยังไม่ได้เชื่อมกับเครื่องอื่น</div>
    <div class="sync-desc">สร้างรหัสใหม่ในเครื่องนี้ แล้วกรอกรหัสเดียวกันในเครื่องอื่นที่อยากให้ข้อมูลเชื่อมกัน</div>
    <button class="sync-primary-btn" id="syncCreateBtn">สร้างรหัสใหม่</button>
    <div class="sync-or">หรือกรอกรหัสที่มีอยู่แล้ว</div>
    <input class="sync-code-input" id="syncCodeInput" placeholder="กรอกรหัส" maxlength="${SYNC_CODE_LEN}" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" />
    <button class="sync-secondary-btn" id="syncJoinBtn">เชื่อมด้วยรหัสนี้</button>
    <div class="sync-msg" id="syncMsg"></div>
  `;
}

function showSyncPanel() {
  const overlay = document.createElement("div");
  overlay.className = "sync-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="sync-panel">
      <div class="sync-panel-title">เชื่อมอุปกรณ์</div>
      <div id="syncPanelBody">${syncPanelBodyHtml()}</div>
    </div>
    <div class="sync-hint">แตะที่ไหนก็ได้เพื่อปิด</div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".sync-panel").addEventListener("click", (e) => e.stopPropagation());

  function msg(text, isError) {
    const el = overlay.querySelector("#syncMsg");
    if (el) {
      el.textContent = text;
      el.classList.toggle("error", !!isError);
    }
  }

  function rerenderBody() {
    overlay.querySelector("#syncPanelBody").innerHTML = syncPanelBodyHtml();
    wireBody();
  }

  function wireBody() {
    const createBtn = overlay.querySelector("#syncCreateBtn");
    if (createBtn) {
      createBtn.addEventListener("click", async () => {
        createBtn.disabled = true;
        msg("กำลังสร้างรหัส...");
        try {
          await ToolHubSync.createAndLink();
          rerenderBody();
        } catch (e) {
          createBtn.disabled = false;
          msg("เชื่อมไม่สำเร็จ ลองใหม่อีกครั้ง (เช็คอินเทอร์เน็ต)", true);
        }
      });
    }

    const joinBtn = overlay.querySelector("#syncJoinBtn");
    if (joinBtn) {
      joinBtn.addEventListener("click", async () => {
        const input = overlay.querySelector("#syncCodeInput");
        const code = (input.value || "").trim().toUpperCase();
        if (!code) {
          msg("กรอกรหัสก่อน", true);
          return;
        }
        joinBtn.disabled = true;
        msg("กำลังเชื่อม...");
        try {
          await ToolHubSync.link(code);
          rerenderBody();
        } catch (e) {
          joinBtn.disabled = false;
          msg("เชื่อมไม่สำเร็จ ลองใหม่อีกครั้ง (เช็คอินเทอร์เน็ต)", true);
        }
      });
    }

    const copyBtn = overlay.querySelector("#syncCopyBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(ToolHubSync.getCode());
          msg("คัดลอกแล้ว");
        } catch (e) {
          msg("คัดลอกไม่สำเร็จ");
        }
      });
    }

    const nowBtn = overlay.querySelector("#syncNowBtn");
    if (nowBtn) {
      nowBtn.addEventListener("click", async () => {
        nowBtn.disabled = true;
        msg("กำลังซิงค์...");
        let ok = true;
        try {
          await ToolHubSync.pullNow();
        } catch (e) {
          ok = false;
        }
        rerenderBody(); // สถานะ "ยังไม่ได้ขึ้นคลาวด์ / ครบแล้ว" อัปเดตตามผลรอบนี้
        msg(ok ? "ซิงค์ล่าสุดแล้ว" : "ซิงค์ไม่สำเร็จ เช็คอินเทอร์เน็ต", !ok);
        if (ok && typeof render === "function") render();
      });
    }

    const unlinkBtn = overlay.querySelector("#syncUnlinkBtn");
    if (unlinkBtn) {
      unlinkBtn.addEventListener("click", () => {
        const ok = confirm(
          "เลิกเชื่อมและล้างข้อมูลทั้งหมดในเครื่องนี้ (สิ่งที่ต้องทำ, บวก/ลบ, หวย, ความทรงจำ ฯลฯ)?\n\nข้อมูลบนคลาวด์ของรหัสนี้จะยังอยู่ครบ กลับมาเชื่อมรหัสเดิมได้ตลอดถ้าจำรหัสได้"
        );
        if (!ok) return;
        ToolHubSync.unlink();
        rerenderBody();
        if (typeof render === "function") render(); // เนื้อหาที่แสดงอยู่ตอนนี้อาจอ้างอิงข้อมูลที่เพิ่งล้างไป
      });
    }
  }

  wireBody();
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
