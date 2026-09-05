// ความทรงจำ — full-screen app (renderMemories, registered in APPS in app.js).
// Data model: books (each a "memory" — a book) containing pages (each a diary-style
// entry: photo, story text, a short "ความประทับใจ" impression line, date/time, location).
// Photos (both a page's photo and a book's custom cover) are resized+compressed
// client-side (MEMORIES_PHOTO_MAX_DIM/MEMORIES_PHOTO_QUALITY) before being stored as
// base64 in localStorage — a raw phone photo would burn through the shared per-origin
// quota in just a few pages otherwise.

const MEMORIES_PHOTO_MAX_DIM = 900;
const MEMORIES_PHOTO_QUALITY = 0.72;

function loadMemoriesState() {
  try {
    const raw = localStorage.getItem("toolhub.memories");
    if (raw) {
      const state = JSON.parse(raw);
      if (!Array.isArray(state.books)) state.books = [];
      state.books.forEach((b) => {
        if (!Array.isArray(b.pages)) b.pages = [];
        if (typeof b.cover !== "string") b.cover = "";
      });
      return state;
    }
  } catch (e) {}
  return { books: [] };
}

function saveMemoriesState(state) {
  localStorage.setItem("toolhub.memories", JSON.stringify(state));
}

function makeMemoriesId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Resize+recompress on a <canvas> so a multi-MB phone photo becomes a small base64 string.
function memoriesReadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("bad image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MEMORIES_PHOTO_MAX_DIM || height > MEMORIES_PHOTO_MAX_DIM) {
          const scale = MEMORIES_PHOTO_MAX_DIM / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", MEMORIES_PHOTO_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function formatMemoriesDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function memoriesToday() {
  return new Date().toISOString().slice(0, 10);
}

function memoriesNowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function memoriesBookCover(book) {
  if (book.cover) return book.cover;
  const withPhoto = [...book.pages].reverse().find((p) => p.photo);
  return withPhoto ? withPhoto.photo : "";
}

// Shared photo-picker widget used by both the book form (cover) and the page form
// (page photo) — wires the <input type=file> → resize → preview, returns a getter.
function memoriesSetupPhotoPicker(panel, { inputId, previewId, labelId, labelIdle, labelBusy, labelChange, initial }) {
  let photoData = initial || "";
  const input = panel.querySelector(`#${inputId}`);
  const preview = panel.querySelector(`#${previewId}`);
  const label = panel.querySelector(`#${labelId}`);
  if (photoData) {
    preview.src = photoData;
    preview.hidden = false;
    label.textContent = labelChange;
  }
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    label.textContent = labelBusy;
    try {
      photoData = await memoriesReadImage(file);
      preview.src = photoData;
      preview.hidden = false;
      label.textContent = labelChange;
    } catch (e) {
      label.textContent = labelIdle;
    }
  });
  return () => photoData;
}

function renderMemories(container) {
  const state = loadMemoriesState();
  let viewBookId = null;

  function draw() {
    const book = viewBookId ? state.books.find((b) => b.id === viewBookId) : null;
    if (book) drawBook(book);
    else drawList();
  }

  function drawList() {
    const books = state.books;
    container.innerHTML = `
      <div class="memories-page">
        <div class="memories-list-header">
          <div class="memories-list-title">📔 ความทรงจำของฉัน</div>
          <button class="memories-create-btn" id="memoriesCreateBtn">+ สร้างความทรงจำ</button>
        </div>
        <div class="memories-shelf" id="memoriesShelf">
          ${
            books.length === 0
              ? `<div class="memories-empty">ยังไม่มีความทรงจำ — เริ่มเล่มแรกกันเลย</div>`
              : books
                  .map((b) => {
                    const cover = memoriesBookCover(b);
                    return `
              <div class="memories-book" data-id="${b.id}">
                <button class="memories-book-del" data-id="${b.id}" aria-label="ลบความทรงจำ">×</button>
                <div class="memories-book-cover" ${cover ? `style="background-image:url('${cover}')"` : ""}>
                  ${!cover ? `<span class="memories-book-cover-icon">📖</span>` : ""}
                </div>
                <div class="memories-book-name">${b.name}</div>
                <div class="memories-book-meta">${b.pages.length} หน้า</div>
              </div>
            `;
                  })
                  .join("")
          }
        </div>
      </div>
    `;

    container.querySelectorAll(".memories-book").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".memories-book-del")) return;
        viewBookId = el.dataset.id;
        draw();
      });
    });
    container.querySelectorAll(".memories-book-del").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.books = state.books.filter((b) => b.id !== btn.dataset.id);
        saveMemoriesState(state);
        draw();
      });
    });
    container.querySelector("#memoriesCreateBtn").addEventListener("click", () => {
      showMemoriesBookForm(null, (name, details, cover) => {
        const book = { id: makeMemoriesId(), name, details, cover, createdAt: Date.now(), pages: [] };
        state.books.push(book);
        saveMemoriesState(state);
        viewBookId = book.id;
        draw();
      });
    });
  }

  function drawBook(book) {
    container.innerHTML = `
      <div class="memories-page memories-book-open">
        <button class="memories-back-btn" id="memoriesBackBtn">‹ ทุกความทรงจำ</button>
        <div class="memories-book-header">
          <div class="memories-book-title">${book.name}</div>
          <button class="memories-edit-btn" id="memoriesEditBtn" aria-label="แก้ไข">✎ แก้ไข</button>
        </div>
        ${book.details ? `<div class="memories-book-details">${book.details}</div>` : ""}
        <div class="memories-pages" id="memoriesPages">
          ${
            book.pages.length === 0
              ? `<div class="memories-empty">ยังไม่มีหน้า — เพิ่มความทรงจำแรกของเล่มนี้กันเลย</div>`
              : book.pages
                  .map((p, i) => {
                    const meta = [];
                    const dateLabel = formatMemoriesDate(p.date);
                    if (dateLabel) meta.push(`📅 ${dateLabel}${p.time ? ` ${p.time}` : ""}`);
                    if (p.location) meta.push(`📍 ${p.location}`);
                    const delay = (Math.min(i, 10) * 0.06).toFixed(2);
                    return `
              <div class="memories-page-card" style="animation-delay: ${delay}s">
                <div class="memories-page-num">หน้า ${i + 1}</div>
                <button class="memories-page-del" data-id="${p.id}" aria-label="ลบหน้านี้">×</button>
                ${p.photo ? `<img class="memories-page-photo" src="${p.photo}" alt="" />` : ""}
                ${p.text ? `<div class="memories-page-text">${p.text}</div>` : ""}
                ${p.impression ? `<div class="memories-page-impression">💭 ${p.impression}</div>` : ""}
                ${meta.length ? `<div class="memories-page-meta">${meta.join(" · ")}</div>` : ""}
              </div>
            `;
                  })
                  .join("")
          }
        </div>
        <button class="memories-add-page-btn" id="memoriesAddPageBtn">+ เพิ่มหน้าใหม่</button>
      </div>
    `;

    container.querySelector("#memoriesBackBtn").addEventListener("click", () => {
      viewBookId = null;
      draw();
    });
    container.querySelector("#memoriesEditBtn").addEventListener("click", () => {
      showMemoriesBookForm(book, (name, details, cover) => {
        book.name = name;
        book.details = details;
        book.cover = cover;
        saveMemoriesState(state);
        draw();
      });
    });
    container.querySelectorAll(".memories-page-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        book.pages = book.pages.filter((p) => p.id !== btn.dataset.id);
        saveMemoriesState(state);
        draw();
      });
    });
    container.querySelector("#memoriesAddPageBtn").addEventListener("click", () => {
      showMemoriesPageForm((page) => {
        book.pages.push(page);
        saveMemoriesState(state);
        draw();
        const cards = container.querySelectorAll(".memories-page-card");
        const last = cards[cards.length - 1];
        if (last) last.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    });
  }

  draw();
}

// book: null → create, or existing book → edit (pre-filled). onSave(name, details, cover)
function showMemoriesBookForm(book, onSave) {
  const overlay = document.createElement("div");
  overlay.className = "memories-form-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="memories-form-panel">
      <div class="memories-form-title">${book ? "แก้ไขความทรงจำ" : "สร้างความทรงจำใหม่"}</div>
      <label class="memories-photo-picker" id="memoriesCoverPicker">
        <span id="memoriesCoverPickerLabel">🖼️ ตั้งหน้าปก (ไม่บังคับ)</span>
        <img id="memoriesCoverPreview" class="memories-photo-preview" hidden />
        <input type="file" accept="image/*" id="memoriesCoverInput" hidden />
      </label>
      <input type="text" id="memoriesNameInput" class="memories-form-input" placeholder="ชื่อความทรงจำ" maxlength="60" />
      <textarea id="memoriesDetailsInput" class="memories-form-textarea" placeholder="รายละเอียด (ไม่บังคับ)" maxlength="300"></textarea>
      <button class="memories-form-submit" id="memoriesFormSubmit">${book ? "บันทึก" : "สร้าง"}</button>
    </div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".memories-form-panel").addEventListener("click", (e) => e.stopPropagation());

  const getCover = memoriesSetupPhotoPicker(overlay, {
    inputId: "memoriesCoverInput",
    previewId: "memoriesCoverPreview",
    labelId: "memoriesCoverPickerLabel",
    labelIdle: "🖼️ ตั้งหน้าปก (ไม่บังคับ)",
    labelBusy: "กำลังประมวลผลรูป...",
    labelChange: "🖼️ เปลี่ยนหน้าปก",
    initial: book ? book.cover : "",
  });

  const nameInput = overlay.querySelector("#memoriesNameInput");
  if (book) {
    nameInput.value = book.name;
    overlay.querySelector("#memoriesDetailsInput").value = book.details || "";
  }

  overlay.querySelector("#memoriesFormSubmit").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    const details = overlay.querySelector("#memoriesDetailsInput").value.trim();
    overlay.remove();
    onSave(name, details, getCover());
  });

  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
  nameInput.focus();
}

function showMemoriesPageForm(onSave) {
  const overlay = document.createElement("div");
  overlay.className = "memories-form-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="memories-form-panel">
      <div class="memories-form-title">เพิ่มหน้าใหม่</div>
      <label class="memories-photo-picker" id="memoriesPhotoPicker">
        <span id="memoriesPhotoPickerLabel">📷 เพิ่มรูปภาพ (ไม่บังคับ)</span>
        <img id="memoriesPhotoPreview" class="memories-photo-preview" hidden />
        <input type="file" accept="image/*" id="memoriesPhotoInput" hidden />
      </label>
      <textarea id="memoriesTextInput" class="memories-form-textarea" placeholder="เขียนเรื่องราว..." maxlength="1000"></textarea>
      <input type="text" id="memoriesImpressionInput" class="memories-form-input" placeholder="💭 ความประทับใจ (ไม่บังคับ)" maxlength="150" />
      <div class="memories-form-row">
        <input type="date" id="memoriesDateInput" class="memories-form-input" />
        <input type="time" id="memoriesTimeInput" class="memories-form-input" />
      </div>
      <input type="text" id="memoriesLocationInput" class="memories-form-input" placeholder="📍 สถานที่ (ไม่บังคับ)" maxlength="80" />
      <button class="memories-form-submit" id="memoriesFormSubmit">บันทึกหน้านี้</button>
    </div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".memories-form-panel").addEventListener("click", (e) => e.stopPropagation());

  overlay.querySelector("#memoriesDateInput").value = memoriesToday();
  overlay.querySelector("#memoriesTimeInput").value = memoriesNowTime();

  const getPhoto = memoriesSetupPhotoPicker(overlay, {
    inputId: "memoriesPhotoInput",
    previewId: "memoriesPhotoPreview",
    labelId: "memoriesPhotoPickerLabel",
    labelIdle: "📷 เพิ่มรูปภาพ (ไม่บังคับ)",
    labelBusy: "กำลังประมวลผลรูป...",
    labelChange: "📷 เปลี่ยนรูปภาพ",
    initial: "",
  });

  overlay.querySelector("#memoriesFormSubmit").addEventListener("click", () => {
    const text = overlay.querySelector("#memoriesTextInput").value.trim();
    const photo = getPhoto();
    if (!text && !photo) {
      overlay.querySelector("#memoriesTextInput").focus();
      return;
    }
    const page = {
      id: makeMemoriesId(),
      text,
      photo,
      impression: overlay.querySelector("#memoriesImpressionInput").value.trim(),
      date: overlay.querySelector("#memoriesDateInput").value || "",
      time: overlay.querySelector("#memoriesTimeInput").value || "",
      location: overlay.querySelector("#memoriesLocationInput").value.trim(),
      createdAt: Date.now(),
    };
    overlay.remove();
    onSave(page);
  });

  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
