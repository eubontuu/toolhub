// ทางลัด (Quick Start) — Home-screen widget, read/write in place. Owner picks which top-level
// APPS entries to pin here for instant access without opening the sidebar. Takes `apps` (the
// APPS array) and `onNavigate` (app.js's navigate()) as params rather than reading app.js's
// globals directly, so this file stays self-contained like todo.js.

let quickStartPicking = false;

function loadQuickStartState() {
  try {
    const raw = localStorage.getItem("toolhub.quickstart");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {}
  return [];
}

function saveQuickStartState(ids) {
  localStorage.setItem("toolhub.quickstart", JSON.stringify(ids));
}

function quickStartIconHtml(app) {
  return app.iconImg
    ? `<img src="${app.iconImg}" class="quickstart-tile-icon-img" alt="" />`
    : `<span class="quickstart-tile-icon">${app.icon}</span>`;
}

function renderQuickStart(container, apps, onNavigate) {
  function draw() {
    const pinnedIds = loadQuickStartState().filter((id) => apps.some((a) => a.id === id));
    const pinnedApps = pinnedIds.map((id) => apps.find((a) => a.id === id));
    const available = apps.filter((a) => !pinnedIds.includes(a.id));

    container.innerHTML = `
      <div class="quickstart-widget">
        <div class="quickstart-title">⚡ ทางลัด</div>
        <div class="quickstart-grid">
          ${pinnedApps
            .map(
              (app) => `
            <div class="quickstart-tile">
              <button class="quickstart-tile-btn" data-route="app/${app.id}">
                ${quickStartIconHtml(app)}
                <span class="quickstart-tile-label">${app.name}</span>
              </button>
              <button class="quickstart-tile-remove" data-remove="${app.id}" aria-label="เอาออกจากทางลัด">×</button>
            </div>`
            )
            .join("")}
          ${
            available.length > 0
              ? `<button class="quickstart-tile-add" id="quickstartAddBtn">
                  <span class="quickstart-tile-icon">+</span>
                  <span class="quickstart-tile-label">เพิ่ม</span>
                </button>`
              : ""
          }
        </div>
        ${pinnedApps.length === 0 ? `<div class="quickstart-empty">ยังไม่มีทางลัด — กด + เพื่อเพิ่ม</div>` : ""}
        ${
          quickStartPicking && available.length > 0
            ? `<div class="quickstart-picker">
                ${available
                  .map(
                    (app) => `
                  <button class="quickstart-picker-item" data-add="${app.id}">
                    ${quickStartIconHtml(app)}
                    <span>${app.name}</span>
                  </button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>
    `;

    container.querySelectorAll(".quickstart-tile-btn").forEach((btn) => {
      btn.addEventListener("click", () => onNavigate(btn.dataset.route));
    });

    container.querySelectorAll(".quickstart-tile-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveQuickStartState(loadQuickStartState().filter((id) => id !== btn.dataset.remove));
        draw();
      });
    });

    const addBtn = container.querySelector("#quickstartAddBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        quickStartPicking = !quickStartPicking;
        draw();
      });
    }

    container.querySelectorAll(".quickstart-picker-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ids = loadQuickStartState();
        ids.push(btn.dataset.add);
        saveQuickStartState(ids);
        quickStartPicking = false;
        draw();
      });
    });
  }

  draw();
}
