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
  const [, appId] = route.split("/");
  const app = APPS.find((a) => a.id === appId);
  if (!app) {
    renderHome();
    return;
  }
  renderToolShell(app);
}

function renderHome() {
  root.innerHTML = `
    <div class="home">
      <h1>ToolHub</h1>
      <p class="sub">รวมเครื่องมือของคุณไว้ที่เดียว</p>
      <div class="grid" id="grid"></div>
      ${APPS.length === 0 ? '<div class="empty-hint">ยังไม่มีเครื่องมือ — จะเพิ่มเข้ามาเรื่อยๆ</div>' : ""}
    </div>
  `;
  const grid = document.getElementById("grid");
  APPS.forEach((app) => {
    const btn = document.createElement("button");
    btn.className = "icon-btn";
    btn.innerHTML = `<div class="icon-tile">${app.icon}</div><div class="icon-label">${app.name}</div>`;
    btn.addEventListener("click", () => navigate(`app/${app.id}`));
    grid.appendChild(btn);
  });
}

function renderToolShell(app) {
  root.innerHTML = `
    <div class="tool-screen">
      <div class="tool-header">
        <button class="back-btn" id="back">‹</button>
        <div class="tool-title">${app.name}</div>
      </div>
      <div class="tool-body" id="tool-body"></div>
    </div>
  `;
  document.getElementById("back").addEventListener("click", () => navigate("home"));
  app.render(document.getElementById("tool-body"));
}

// ---------- Boot ----------

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}
