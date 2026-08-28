// ToolHub — app shell + registry
// เพิ่มเครื่องมือใหม่ในอนาคต: push object ลงใน APPS แล้วเขียนฟังก์ชัน render ของมัน (ไฟล์แยกใน tools/, ดู index.html สำหรับลำดับโหลด)

const APPS = [
  {
    id: "counter",
    name: "บวก/ลบ",
    icon: "±",
    iconImg: "icons/emoji/abacus.svg",
    render: renderCounter,
  },
  {
    id: "wonglao",
    name: "วงเหล้า",
    icon: "🍻",
    iconImg: "icons/emoji/beers.svg",
    render: renderWongLao,
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

// ---------- Home promo card dismiss state ----------

const HOME_PROMO_KEY = "toolhub.homePromoDismissed";

function loadHomePromoDismissed() {
  try {
    return localStorage.getItem(HOME_PROMO_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function saveHomePromoDismissed() {
  try {
    localStorage.setItem(HOME_PROMO_KEY, "1");
  } catch (e) {}
}

function renderHome() {
  const promoDismissed = loadHomePromoDismissed();
  root.innerHTML = `
    <div class="home home-v2">
      <div class="home-topbar">
        <button class="icon-action-btn" id="menuBtn" aria-label="เมนู">☰</button>
        <div class="home-topbar-brand">
          <span class="home-topbar-logo">🐷</span>
          <span class="home-topbar-name">คลังแสงหมูอุ๊ด</span>
        </div>
        <div class="theme-picker" id="themePicker">
          <button class="icon-action-btn theme-btn" id="themeToggleBtn">ธีม</button>
        </div>
      </div>

      ${
        promoDismissed
          ? ""
          : `
      <div class="home-promo-card" id="promoCard">
        <div class="home-promo-icon">🐷</div>
        <div class="home-promo-text">
          <div class="home-promo-title">ยินดีต้อนรับสู่คลังแสงอัจฉริยะ ของตระกูลหมู</div>
          <div class="home-promo-sub">เชิญเดินชมได้เต็มที่ เลือกหยิบสิ่งที่อยากได้ เชิญครับ อู๊ด อู๊ดดดด</div>
        </div>
        <button class="home-promo-close" id="promoClose" aria-label="ปิด">✕</button>
      </div>`
      }

      <div class="grid" id="grid"></div>
      ${APPS.length === 0 ? '<div class="empty-hint">ยังไม่มีเครื่องมือ — จะเพิ่มเข้ามาเรื่อยๆ</div>' : ""}
      <div class="todo-widget" id="todoWidget"></div>
      <div class="hike-widget" id="hikeWidget"></div>
      <button class="changelog-fab" id="changelogBtn">Update log</button>

      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <nav class="home-sidebar" id="homeSidebar">
        <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="ปิดเมนู">‹</button>
        <div class="sidebar-brand">
          <span class="sidebar-brand-icon">🐷</span>
          <div>
            <div class="sidebar-brand-name">คลังแสงหมูอุ๊ด</div>
            <div class="sidebar-brand-version">ToolHub</div>
          </div>
        </div>
        <div class="sidebar-search">🔍 <span>ค้นหาเครื่องมือ</span></div>
        <div class="sidebar-nav">
          <button class="sidebar-nav-item active" data-route="home">🏠 <span>หน้าแรก</span></button>
          ${APPS.map(
            (app) => `
          <button class="sidebar-nav-item" data-route="app/${app.id}">${
              app.iconImg
                ? `<img src="${app.iconImg}" class="sidebar-nav-icon" alt="" />`
                : `<span>${app.icon}</span>`
            } <span>${app.name}</span></button>`
          ).join("")}
          <button class="sidebar-nav-item" data-route="changelog">🕓 <span>การอัปเดต</span></button>
        </div>
      </nav>
    </div>
  `;
  document.getElementById("changelogBtn").addEventListener("click", () => navigate("changelog"));
  setupThemePicker(document.getElementById("themePicker"));
  renderTodo(document.getElementById("todoWidget"));
  renderHikePrep(document.getElementById("hikeWidget"));
  const grid = document.getElementById("grid");
  APPS.forEach((app) => {
    const btn = document.createElement("button");
    btn.className = "icon-btn";
    btn.innerHTML = `<div class="icon-tile">${app.iconImg ? `<img src="${app.iconImg}" alt="${app.name}" class="icon-img" />` : app.icon}</div><div class="icon-label">${app.name}</div>`;
    btn.addEventListener("click", () => navigate(`app/${app.id}`));
    grid.appendChild(btn);
  });

  const promoClose = document.getElementById("promoClose");
  if (promoClose) {
    promoClose.addEventListener("click", () => {
      saveHomePromoDismissed();
      document.getElementById("promoCard").remove();
    });
  }

  const sidebar = document.getElementById("homeSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("open");
  }
  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
  }
  document.getElementById("menuBtn").addEventListener("click", openSidebar);
  document.getElementById("sidebarCollapseBtn").addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);
  sidebar.querySelectorAll(".sidebar-nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      closeSidebar();
      navigate(item.dataset.route);
    });
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

    // close a top reveal card (Ohana/ไพ่สุ่ม/สุ่ม/Flash Quiz) before navigating, if one is open
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
