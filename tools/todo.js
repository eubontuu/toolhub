// สิ่งที่ต้องทำ — full-screen app (renderTodo, registered in APPS in app.js).
// No dependency on other tool files.

function loadTodoState() {
  try {
    const raw = localStorage.getItem("toolhub.todo");
    if (raw) {
      const state = JSON.parse(raw);
      if (!Array.isArray(state.items)) state.items = [];
      return state;
    }
  } catch (e) {}
  return { items: [] };
}

function saveTodoState(state) {
  localStorage.setItem("toolhub.todo", JSON.stringify(state));
}

function makeTodoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatTodoDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function todoDaysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr + "T00:00:00");
  if (isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function todoCountdownLabel(daysLeft) {
  if (daysLeft === null) return "";
  if (daysLeft < 0) return `เกินกำหนด ${Math.abs(daysLeft)} วัน`;
  if (daysLeft === 0) return "วันนี้";
  if (daysLeft === 1) return "พรุ่งนี้";
  return `เหลืออีก ${daysLeft} วัน`;
}

function todoUrgencyClass(item) {
  if (item.done || !item.date) return "";
  const daysLeft = todoDaysUntil(item.date);
  if (daysLeft === null) return "";
  if (daysLeft <= 3) return "todo-due-urgent";
  if (daysLeft <= 5) return "todo-due-soon";
  return "";
}

function todoMetaLine(item) {
  const parts = [];
  const dateLabel = formatTodoDate(item.date);
  if (dateLabel) {
    const countdown = todoCountdownLabel(todoDaysUntil(item.date));
    parts.push(`📅 ${dateLabel}${countdown ? ` (${countdown})` : ""}`);
  }
  if (item.subject) parts.push(item.subject);
  return parts.join(" · ");
}

function renderTodo(container) {
  const state = loadTodoState();

  function draw() {
    const total = state.items.length;
    const doneCount = state.items.filter((item) => item.done).length;

    container.innerHTML = `
      <div class="todo-page">
        <div class="todo-widget">
          <div class="todo-title">📝 สิ่งที่ต้องทำ</div>
          <div class="todo-input-row">
            <input type="text" id="todoInput" class="todo-input" placeholder="เขียนสิ่งที่ต้องทำ..." />
            <button class="todo-add-btn" id="todoAddBtn">+</button>
          </div>
          <div class="todo-optional-row">
            <input type="date" id="todoDateInput" class="todo-optional-input" />
            <input type="text" id="todoSubjectInput" class="todo-optional-input" placeholder="วิชา (ไม่บังคับ)" />
          </div>
          <div class="todo-list" id="todoList">
            ${
              total === 0
                ? `<div class="todo-empty">ยังไม่มีรายการ — เขียนสิ่งที่ต้องทำได้เลย</div>`
                : state.items
                    .map((item) => {
                      const urgency = todoUrgencyClass(item);
                      const meta = todoMetaLine(item);
                      return `
                <div class="todo-item ${item.done ? "done" : ""} ${urgency}">
                  <button class="todo-check ${item.done ? "done" : ""}" data-id="${item.id}">${item.done ? "เสร็จแล้ว" : ""}</button>
                  <div class="todo-item-body">
                    <span class="todo-text">${item.text}</span>
                    ${meta ? `<span class="todo-meta">${meta}</span>` : ""}
                  </div>
                  <button class="todo-del" data-id="${item.id}">×</button>
                </div>
              `;
                    })
                    .join("")
            }
          </div>
          ${
            total > 0
              ? `<div class="todo-footer">
                  <span class="todo-count">เสร็จแล้ว ${doneCount}/${total}</span>
                  ${doneCount > 0 ? `<button class="reset-btn" id="todoClearDone">ลบที่เสร็จแล้ว</button>` : ""}
                </div>`
              : ""
          }
        </div>
      </div>
    `;

    const input = container.querySelector("#todoInput");
    const dateInput = container.querySelector("#todoDateInput");
    const subjectInput = container.querySelector("#todoSubjectInput");

    function addItem() {
      const text = input.value.trim();
      if (!text) return;
      state.items.push({
        id: makeTodoId(),
        text,
        done: false,
        date: dateInput.value || "",
        subject: subjectInput.value.trim(),
      });
      saveTodoState(state);
      draw();
      container.querySelector("#todoInput").focus();
    }

    container.querySelector("#todoAddBtn").addEventListener("click", addItem);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addItem();
    });

    container.querySelectorAll(".todo-check").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = state.items.find((i) => i.id === btn.dataset.id);
        item.done = !item.done;
        saveTodoState(state);
        draw();
      });
    });

    container.querySelectorAll(".todo-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.items = state.items.filter((i) => i.id !== btn.dataset.id);
        saveTodoState(state);
        draw();
      });
    });

    const clearDoneBtn = container.querySelector("#todoClearDone");
    if (clearDoneBtn) {
      clearDoneBtn.addEventListener("click", () => {
        state.items = state.items.filter((i) => !i.done);
        saveTodoState(state);
        draw();
      });
    }
  }

  draw();
}
