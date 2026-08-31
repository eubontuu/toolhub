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
  {
    id: "huay",
    name: "หวย",
    icon: "🎫",
    render: renderHuay,
  },
  {
    id: "games",
    name: "เกม",
    icon: "🎮",
    render: renderGames,
  },
  {
    id: "todo",
    name: "สิ่งที่ต้องทำ",
    icon: "📝",
    render: renderTodo,
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

// route ที่แถบเมนูควรไฮไลท์ตอนเปิด — ปกติคือ "home" แต่ตอนเปิดจากหน้าเครื่องมือ ให้ไฮไลท์แอปที่กำลังอยู่แทน
let sidebarActiveRoute = "home";

function currentRoute() {
  return location.hash.replace(/^#/, "") || "home";
}

// แถบเมนู (sidebar) เป็น overlay ลอยบน document.body เสมอ ไม่ใช่ส่วนหนึ่งของ renderHome()/
// renderToolShell() — เปิดได้จากทุกหน้าโดยไม่ต้อง navigate ไปหน้าแรกก่อน พื้นหลังหลัง sidebar
// เลยเป็นหน้าปัจจุบันจริงๆ (ไม่ใช่หน้าแรกเสมอเหมือนเดิม). ใช้ position:fixed เต็มจอ ไม่ผูกกับ
// --app-max-width คอลัมน์ตรงกลาง (ดู CLAUDE.md's Width cap rule).
function openSidebarOverlay() {
  if (document.querySelector(".home-sidebar")) return;

  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  const sidebar = document.createElement("nav");
  sidebar.className = "home-sidebar";
  sidebar.innerHTML = `
    <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="ปิดเมนู">‹</button>
    <div class="sidebar-brand">
      <span class="sidebar-brand-icon">🐷</span>
      <div>
        <div class="sidebar-brand-name">คลังแสงหมูอุ๊ด</div>
        <div class="sidebar-brand-version">ToolHub</div>
      </div>
    </div>
    <div class="sidebar-nav">
      <button class="sidebar-nav-item ${sidebarActiveRoute === "home" ? "active" : ""}" data-route="home">🏠 <span>หน้าแรก</span></button>
      ${APPS.map(
        (app) => `
      <button class="sidebar-nav-item ${sidebarActiveRoute === `app/${app.id}` ? "active" : ""}" data-route="app/${app.id}">${
          app.iconImg
            ? `<img src="${app.iconImg}" class="sidebar-nav-icon" alt="" />`
            : `<span>${app.icon}</span>`
        } <span>${app.name}</span></button>`
      ).join("")}
    </div>
    <div class="sidebar-footer">
      <button class="sidebar-nav-item ${sidebarActiveRoute === "changelog" ? "active" : ""}" data-route="changelog">🕓 <span>การอัปเดต</span></button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(sidebar);

  function closeSidebar() {
    sidebar.remove();
    overlay.remove();
  }
  overlay.addEventListener("click", closeSidebar);
  sidebar.querySelector("#sidebarCollapseBtn").addEventListener("click", closeSidebar);
  sidebar.querySelectorAll(".sidebar-nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      closeSidebar();
      navigate(item.dataset.route);
    });
  });

  void sidebar.offsetHeight;
  sidebar.classList.add("open");
  overlay.classList.add("open");
}

function render() {
  const route = currentRoute();
  if (route === "home") {
    sidebarActiveRoute = "home";
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

      <div class="home-welcome">ยินดีต้อนรับกลับมา 🐷</div>
      <div class="home-subtitle">รวมเครื่องมือ เกม และของเล่นเล็กๆ ไว้ที่เดียว — กดปุ่ม ☰ มุมซ้ายบนเพื่อดูทั้งหมด</div>
      <div id="quickstartContent"></div>
      <div class="home-content" id="homeContent"></div>
    </div>
  `;
  setupThemePicker(document.getElementById("themePicker"));
  renderQuickStart(document.getElementById("quickstartContent"), APPS, navigate);
  renderTodoPreview(document.getElementById("homeContent"));
  document.getElementById("homeTodoEditBtn").addEventListener("click", () => navigate("app/todo"));
  document.getElementById("menuBtn").addEventListener("click", () => {
    sidebarActiveRoute = "home";
    openSidebarOverlay();
  });
}

function renderToolShell(title, renderFn) {
  root.innerHTML = `
    <div class="tool-screen">
      <div class="tool-header">
        <button class="back-btn" id="back">‹</button>
        <div class="tool-title">${title}</div>
        <div class="theme-picker" id="themePicker">
          <button class="icon-action-btn theme-btn" id="themeToggleBtn">ธีม</button>
        </div>
      </div>
      <div class="tool-body" id="tool-body"></div>
    </div>
  `;
  setupThemePicker(document.getElementById("themePicker"));
  document.getElementById("back").addEventListener("click", () => {
    sidebarActiveRoute = currentRoute();
    openSidebarOverlay();
  });
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
    // close the sidebar drawer if it's open, rather than falling through to .back-btn navigation
    const openSidebar = document.querySelector(".home-sidebar.open");
    if (openSidebar) {
      document.querySelector(".sidebar-overlay").click();
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
