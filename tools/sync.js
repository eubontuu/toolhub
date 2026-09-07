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
// แล้วลองใหม่ตอนบูต/กด "ซิงค์เดี๋ยวนี้" รอบถัดไป. ไม่มี real-time listener — ต้องเปิดแอปใหม่/กดซิงค์เอง
// ถึงจะเห็นข้อมูลจากเครื่องอื่น (ไม่ใช่ live collaboration).

const SYNC_CODE_KEY = "toolhub.sync.code";
const SYNC_PENDING_KEY = "toolhub.sync.pending";
const SYNC_OWN_KEYS = new Set([SYNC_CODE_KEY, SYNC_PENDING_KEY]);
const SYNC_KEY_PREFIX = "toolhub.";
const SYNC_PULL_TIMEOUT_MS = 4000;
const SYNC_PUSH_DEBOUNCE_MS = 900;
const SYNC_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // ไม่มี 0/O, 1/I/L กันอ่านผิด
const SYNC_CODE_LEN = 10;

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

async function attemptPush(code, key) {
  try {
    await firebaseReady();
    const raw = localStorage.getItem(key);
    if (raw === null) {
      clearPending(key);
      return;
    }
    await docRef(code, key).set({ value: raw, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    clearPending(key);
  } catch (e) {
    // ยังไม่สำเร็จ (ออฟไลน์/บล็อก) — ค้างไว้ใน pending รอ ready()/pullNow() รอบถัดไปลองใหม่
  }
}

async function flushPending(code) {
  for (const key of loadPending()) {
    await attemptPush(code, key);
  }
}

async function pullAll(code) {
  await firebaseReady();
  const snap = await firestoreDb.collection("syncCodes").doc(code).collection("data").get();
  snap.forEach((doc) => {
    const key = doc.id;
    const { value } = doc.data();
    if (key.startsWith(SYNC_KEY_PREFIX) && !SYNC_OWN_KEYS.has(key) && typeof value === "string") {
      try {
        nativeSetItem(key, value);
      } catch (e) {}
    }
  });
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
  // เรียกตอนบูตแอปก่อน render() ครั้งแรก — ไม่ทำอะไรเลยถ้ายังไม่เคยเชื่อม (ไม่แตะเน็ตเวิร์ก)
  async ready() {
    const code = loadSyncCode();
    if (!code) return;
    await Promise.race([
      pullAll(code).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, SYNC_PULL_TIMEOUT_MS)),
    ]);
    flushPending(code).catch(() => {});
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
    await firebaseReady();
    const snap = await firestoreDb.collection("syncCodes").doc(code).collection("data").get();
    const remoteKeys = new Set();
    snap.forEach((doc) => {
      const key = doc.id;
      const { value } = doc.data();
      if (key.startsWith(SYNC_KEY_PREFIX) && !SYNC_OWN_KEYS.has(key) && typeof value === "string") {
        remoteKeys.add(key);
        try {
          nativeSetItem(key, value);
        } catch (e) {}
      }
    });
    syncableKeys()
      .filter((k) => !remoteKeys.has(k))
      .forEach((k) => queuePush(k));
  },
  unlink() {
    try {
      localStorage.removeItem(SYNC_CODE_KEY);
      localStorage.removeItem(SYNC_PENDING_KEY);
    } catch (e) {}
  },
  // ปุ่ม "ซิงค์เดี๋ยวนี้" — ดึงข้อมูลล่าสุดจากคลาวด์ + ลอง push งานที่ค้างอีกครั้ง
  async pullNow() {
    const code = loadSyncCode();
    if (!code) return;
    await pullAll(code);
    await flushPending(code);
  },
};

window.ToolHubSync = ToolHubSync;

// ---------- UI: แผงเชื่อมอุปกรณ์ (เปิดจากปุ่มใน sidebar) ----------

function syncPanelBodyHtml() {
  const code = ToolHubSync.getCode();
  if (code) {
    return `
      <div class="sync-status linked">🔗 เชื่อมอยู่</div>
      <div class="sync-code-display">${code}</div>
      <div class="sync-caption">กรอกรหัสนี้ในเครื่องอื่นเพื่อเชื่อมข้อมูลเข้าด้วยกัน ห้ามแชร์ให้คนอื่น</div>
      <button class="sync-secondary-btn" id="syncCopyBtn">คัดลอกรหัส</button>
      <button class="sync-secondary-btn" id="syncNowBtn">ซิงค์เดี๋ยวนี้</button>
      <button class="sync-danger-btn" id="syncUnlinkBtn">เลิกเชื่อม</button>
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
        try {
          await ToolHubSync.pullNow();
          msg("ซิงค์ล่าสุดแล้ว");
          if (typeof render === "function") render();
        } catch (e) {
          msg("ซิงค์ไม่สำเร็จ เช็คอินเทอร์เน็ต", true);
        }
        nowBtn.disabled = false;
      });
    }

    const unlinkBtn = overlay.querySelector("#syncUnlinkBtn");
    if (unlinkBtn) {
      unlinkBtn.addEventListener("click", () => {
        ToolHubSync.unlink();
        rerenderBody();
      });
    }
  }

  wireBody();
  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
