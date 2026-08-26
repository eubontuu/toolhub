// ToolHub — app shell + registry
// เพิ่มเครื่องมือใหม่ในอนาคต: push object ลงใน APPS แล้วเขียนฟังก์ชัน render ของมัน (ไฟล์แยกใน tools/, ดู index.html สำหรับลำดับโหลด)

const APPS = [
  {
    id: "counter",
    name: "บวก/ลบ",
    icon: "±",
    render: renderCounter,
  },
  {
    id: "wonglao",
    name: "วงเหล้า",
    icon: "🍻",
    render: renderWongLao,
  },
  {
    id: "hikeprep",
    name: "เตรียมเดินป่า",
    icon: "🥾",
    render: renderHikePrep,
  },
];

const root = document.getElementById("app");

// ---------- Theme picker ----------

const THEME_KEY = "toolhub.theme";

const THEMES = [
  { id: "dark", label: "ดำ", group: "แนะนำ", bg: "#0f1115", accent: "#4c8dff" },
  { id: "light", label: "ขาว", group: "แนะนำ", bg: "#f4f5f7", accent: "#4c8dff" },
  { id: "grape", label: "ม่วงชมพู", group: "อื่นๆ", bg: "#180f22", accent: "#e0529c" },
  { id: "ivory", label: "ครีมขาว", group: "อื่นๆ", bg: "#f7f1e3", accent: "#c9762f" },
  { id: "mint", label: "มินต์", group: "อื่นๆ", bg: "#eaf7f3", accent: "#0ea472" },
  { id: "sunset", label: "ซันเซ็ต", group: "อื่นๆ", bg: "#1f130f", accent: "#e8632f" },
];

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.some((t) => t.id === saved) ? saved : "dark";
  } catch (e) {
    return "dark";
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  const info = THEMES.find((t) => t.id === theme);
  if (meta && info) meta.content = info.bg;
}

applyTheme(loadTheme());

function setupThemePicker(container) {
  const btn = container.querySelector("#themeToggleBtn");
  const groups = [...new Set(THEMES.map((t) => t.group))];
  let panel = null;

  function onDocClick(e) {
    if (!container.contains(e.target)) closePanel();
  }

  function closePanel() {
    if (!panel) return;
    panel.remove();
    panel = null;
    document.removeEventListener("click", onDocClick, true);
  }

  function openPanel() {
    const current = loadTheme();
    panel = document.createElement("div");
    panel.className = "theme-panel";
    panel.innerHTML = groups
      .map(
        (g) => `
      <div class="theme-panel-label">${g}</div>
      <div class="theme-swatch-row">
        ${THEMES.filter((t) => t.group === g)
          .map(
            (t) => `
          <button class="theme-swatch ${t.id === current ? "active" : ""}" data-theme-id="${t.id}">
            <span class="theme-swatch-dot" style="background: linear-gradient(135deg, ${t.bg}, ${t.accent})"></span>
            <span class="theme-swatch-label">${t.label}</span>
          </button>
        `
          )
          .join("")}
      </div>
    `
      )
      .join("");
    container.appendChild(panel);

    panel.querySelectorAll(".theme-swatch").forEach((swatch) => {
      swatch.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = swatch.dataset.themeId;
        saveTheme(id);
        applyTheme(id);
        panel
          .querySelectorAll(".theme-swatch")
          .forEach((s) => s.classList.toggle("active", s.dataset.themeId === id));
      });
    });

    setTimeout(() => document.addEventListener("click", onDocClick, true), 0);
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel) closePanel();
    else openPanel();
  });
}

function navigate(route) {
  location.hash = route;
}

function currentRoute() {
  return location.hash.replace(/^#/, "") || "home";
}

function render() {
  const route = currentRoute();
  if (route === "home") {
    renderHome();
    return;
  }
  if (route === "changelog") {
    renderToolShell("การอัปเดต", renderChangelog);
    return;
  }
  const [, appId] = route.split("/");
  const app = APPS.find((a) => a.id === appId);
  if (!app) {
    renderHome();
    return;
  }
  renderToolShell(app.name, app.render);
}

function renderHome() {
  root.innerHTML = `
    <div class="home">
      <div class="home-top">
        <div class="home-banner">
          <h1>🐷 คลังแสงของ หมูอุ๊ด</h1>
          <p class="sub">ยินดีต้อนรับสู่คลังแสงอัจฉริยะ ของตระกูลหมู เชิญเดินชมได้เต็มที่ เลือกหยิบสิ่งที่อยากได้ เชิญครับ อู๊ด อู๊ดดดด</p>
        </div>
        <div class="home-actions">
          <div class="theme-picker" id="themePicker">
            <button class="icon-action-btn theme-btn" id="themeToggleBtn">ธีม</button>
          </div>
          <button class="icon-action-btn" id="changelogBtn" title="ประวัติการอัปเดต">🕘</button>
        </div>
      </div>
      <div class="todo-widget" id="todoWidget"></div>
      <div class="grid" id="grid"></div>
      ${APPS.length === 0 ? '<div class="empty-hint">ยังไม่มีเครื่องมือ — จะเพิ่มเข้ามาเรื่อยๆ</div>' : ""}
    </div>
  `;
  document.getElementById("changelogBtn").addEventListener("click", () => navigate("changelog"));
  setupThemePicker(document.getElementById("themePicker"));
  renderTodo(document.getElementById("todoWidget"));
  const grid = document.getElementById("grid");
  APPS.forEach((app) => {
    const btn = document.createElement("button");
    btn.className = "icon-btn";
    btn.innerHTML = `<div class="icon-tile">${app.icon}</div><div class="icon-label">${app.name}</div>`;
    btn.addEventListener("click", () => navigate(`app/${app.id}`));
    grid.appendChild(btn);
  });
}

function renderToolShell(title, renderFn) {
  root.innerHTML = `
    <div class="tool-screen">
      <div class="tool-header">
        <button class="back-btn" id="back">‹</button>
        <div class="tool-title">${title}</div>
      </div>
      <div class="tool-body" id="tool-body"></div>
    </div>
  `;
  document.getElementById("back").addEventListener("click", () => navigate("home"));
  renderFn(document.getElementById("tool-body"));
}

// ---------- Swipe-right-to-go-back (edge swipe, mirrors the visible back button) ----------

const SWIPE_EDGE_ZONE = 24;
const SWIPE_THRESHOLD = 80;
let swipeStartX = null;
let swipeStartY = null;
let swipeTracking = false;

document.addEventListener(
  "touchstart",
  (e) => {
    const touch = e.touches[0];
    swipeTracking = touch.clientX <= SWIPE_EDGE_ZONE;
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;
  },
  { passive: true }
);

document.addEventListener(
  "touchend",
  (e) => {
    if (!swipeTracking) return;
    swipeTracking = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeStartX;
    const dy = touch.clientY - swipeStartY;
    if (dx < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    // close a top reveal card (Ohana/ไพ่สุ่ม/สุ่มเลข/Flash Quiz) before navigating, if one is open
    const openOverlay = document.querySelector(".reveal-overlay.show");
    if (openOverlay) {
      openOverlay.click();
      return;
    }
    const backBtns = document.querySelectorAll(".back-btn");
    const target = backBtns[backBtns.length - 1];
    if (target) target.click();
  },
  { passive: true }
);

// ---------- Boot ----------

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
