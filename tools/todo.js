// To do list — Home-screen widget (embedded directly in #todoWidget by renderHome in app.js,
// not a routed tool). No dependency on other tool files.

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

function renderTodo(container) {
  const state = loadTodoState();

  function draw() {
    const total = state.items.length;
    const doneCount = state.items.filter((item) => item.done).length;

    container.innerHTML = `
      <div class="todo-title">📝 สิ่งที่ต้องทำ</div>
      <div class="todo-input-row">
        <input type="text" id="todoInput" class="todo-input" placeholder="เขียนสิ่งที่ต้องทำ..." />
        <button class="todo-add-btn" id="todoAddBtn">+</button>
      </div>
      <div class="todo-list" id="todoList">
        ${
          total === 0
            ? `<div class="todo-empty">ยังไม่มีรายการ — เขียนสิ่งที่ต้องทำได้เลย</div>`
            : state.items
                .map(
                  (item) => `
            <div class="todo-item ${item.done ? "done" : ""}">
              <button class="todo-check" data-id="${item.id}">${item.done ? "✓" : ""}</button>
              <span class="todo-text">${item.text}</span>
              <button class="todo-del" data-id="${item.id}">×</button>
            </div>
          `
                )
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
    `;

    const input = container.querySelector("#todoInput");

    function addItem() {
      const text = input.value.trim();
      if (!text) return;
      state.items.push({ id: makeTodoId(), text, done: false });
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
