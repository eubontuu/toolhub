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
      if (typeof state.viewOnly !== "boolean") state.viewOnly = false;
      state.books.forEach((b) => {
        if (!Array.isArray(b.pages)) b.pages = [];
        if (typeof b.cover !== "string") b.cover = "";
      });
      return state;
    }
  } catch (e) {}
  return { books: [], viewOnly: false };
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
  let spreadIndex = 0;
  let spreadDir = "fwd";

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
        spreadIndex = 0;
        spreadDir = "fwd";
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
        spreadIndex = 0;
        spreadDir = "fwd";
        draw();
      });
    });
  }

  // Inner markup for one spread slot's page content (photo/text/impression/meta) — shared
  // by the left and right slot, whichever page index they happen to hold.
  function pageSlotInner(p, idx) {
    const meta = [];
    const dateLabel = formatMemoriesDate(p.date);
    if (dateLabel) meta.push(`📅 ${dateLabel}${p.time ? ` ${p.time}` : ""}`);
    if (p.location) meta.push(`📍 ${p.location}`);
    return `
      <div class="memories-page-num">หน้า ${idx + 1}</div>
      <button class="memories-page-del" data-id="${p.id}" aria-label="ลบหน้านี้">×</button>
      <div class="memories-page-content">
        ${p.photo ? `<img class="memories-page-photo" src="${p.photo}" alt="" />` : ""}
        ${p.text ? `<div class="memories-page-text">${p.text}</div>` : ""}
        ${p.impression ? `<div class="memories-page-impression">💭 ${p.impression}</div>` : ""}
        ${meta.length ? `<div class="memories-page-meta">${meta.join(" · ")}</div>` : ""}
      </div>
    `;
  }

  function openPageEditor(book, page) {
    showMemoriesPageForm(page, (updated) => {
      const idx = book.pages.findIndex((pg) => pg.id === page.id);
      if (idx !== -1) book.pages[idx] = updated;
      saveMemoriesState(state);
      draw();
    });
  }

  function drawBook(book) {
    const totalPages = book.pages.length;
    const totalSpreads = Math.max(1, Math.ceil(totalPages / 2));
    if (spreadIndex >= totalSpreads) spreadIndex = totalSpreads - 1;
    if (spreadIndex < 0) spreadIndex = 0;
    const leftPage = book.pages[spreadIndex * 2];
    const rightPage = book.pages[spreadIndex * 2 + 1];
    const hasPrev = spreadIndex > 0;
    const hasNext = (spreadIndex + 1) * 2 < totalPages;
    const viewOnly = state.viewOnly;

    container.innerHTML = `
      <div class="memories-page memories-book-open">
        <button class="memories-back-btn" id="memoriesBackBtn">‹ ทุกความทรงจำ</button>
        <div class="memories-book-header">
          <div class="memories-book-title">${book.name}</div>
          <div class="memories-book-actions">
            <button class="memories-viewonly-toggle ${viewOnly ? "active" : ""}" id="memoriesViewOnlyBtn">👁️ ดูอย่างเดียว</button>
            <button class="memories-add-page-btn-sm memories-add-page-trigger" id="memoriesAddPageBtnHeader">+ หน้า</button>
            <button class="memories-edit-btn" id="memoriesEditBtn" aria-label="แก้ไข">✎ แก้ไข</button>
          </div>
        </div>
        ${book.details ? `<div class="memories-book-details">${book.details}</div>` : ""}
        ${
          totalPages === 0
            ? `
        <div class="memories-empty">ยังไม่มีหน้า — เพิ่มความทรงจำแรกของเล่มนี้กันเลย</div>
        <button class="memories-add-page-btn memories-add-page-trigger" id="memoriesAddPageBtnEmpty">+ เพิ่มหน้าใหม่</button>
        `
            : `
        <div class="memories-spread ${spreadDir === "back" ? "dir-back" : "dir-fwd"}">
          <div class="memories-spread-page left ${leftPage && !viewOnly ? "clickable" : ""}" id="memoriesSpreadLeft">
            ${leftPage ? pageSlotInner(leftPage, spreadIndex * 2) : ""}
          </div>
          <div class="memories-spread-gutter"></div>
          <div class="memories-spread-page right ${rightPage ? (!viewOnly ? "clickable" : "") : "empty"}" id="memoriesSpreadRight">
            ${
              rightPage
                ? pageSlotInner(rightPage, spreadIndex * 2 + 1)
                : `<button class="memories-add-page-btn memories-add-page-placeholder memories-add-page-trigger">+ เพิ่มหน้าใหม่</button>`
            }
          </div>
        </div>
        <div class="memories-spread-pager">
          <button class="memories-spread-nav" id="memoriesPrevBtn" ${!hasPrev ? "disabled" : ""} aria-label="หน้าก่อนหน้า">‹</button>
          <span class="memories-spread-pager-label">หน้า ${spreadIndex * 2 + 1}${rightPage ? `-${spreadIndex * 2 + 2}` : ""} จาก ${totalPages}</span>
          <button class="memories-spread-nav" id="memoriesNextBtn" ${!hasNext ? "disabled" : ""} aria-label="หน้าถัดไป">›</button>
        </div>
        `
        }
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
    container.querySelector("#memoriesViewOnlyBtn").addEventListener("click", () => {
      state.viewOnly = !state.viewOnly;
      saveMemoriesState(state);
      draw();
    });
    container.querySelectorAll(".memories-page-del").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        book.pages = book.pages.filter((p) => p.id !== btn.dataset.id);
        saveMemoriesState(state);
        draw();
      });
    });
    container.querySelectorAll(".memories-add-page-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        showMemoriesPageForm(null, (page) => {
          book.pages.push(page);
          saveMemoriesState(state);
          spreadIndex = Math.floor((book.pages.length - 1) / 2);
          spreadDir = "fwd";
          draw();
        });
      });
    });

    const prevBtn = container.querySelector("#memoriesPrevBtn");
    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!hasPrev) return;
        spreadIndex--;
        spreadDir = "back";
        draw();
      });
    }
    const nextBtn = container.querySelector("#memoriesNextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!hasNext) return;
        spreadIndex++;
        spreadDir = "fwd";
        draw();
      });
    }

    const leftEl = container.querySelector("#memoriesSpreadLeft");
    const rightEl = container.querySelector("#memoriesSpreadRight");
    if (leftEl) {
      leftEl.addEventListener("click", (e) => {
        if (e.target.closest(".memories-page-del")) return;
        if (!leftPage) return;
        if (viewOnly) {
          if (hasPrev) {
            spreadIndex--;
            spreadDir = "back";
            draw();
          }
        } else {
          openPageEditor(book, leftPage);
        }
      });
    }
    if (rightEl) {
      rightEl.addEventListener("click", (e) => {
        if (e.target.closest(".memories-page-del") || e.target.closest(".memories-add-page-placeholder")) return;
        if (!rightPage) return;
        if (viewOnly) {
          if (hasNext) {
            spreadIndex++;
            spreadDir = "fwd";
            draw();
          }
        } else {
          openPageEditor(book, rightPage);
        }
      });
    }
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

// existingPage: null → create a new page, or an existing page object → edit it in place
// (id/createdAt are preserved). onSave(page) receives the finished page object either way.
function showMemoriesPageForm(existingPage, onSave) {
  const overlay = document.createElement("div");
  overlay.className = "memories-form-overlay reveal-overlay";
  overlay.innerHTML = `
    <div class="memories-form-panel">
      <div class="memories-form-title">${existingPage ? "แก้ไขหน้านี้" : "เพิ่มหน้าใหม่"}</div>
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
      <button class="memories-form-submit" id="memoriesFormSubmit">${existingPage ? "บันทึกการแก้ไข" : "บันทึกหน้านี้"}</button>
    </div>
  `;
  overlay.addEventListener("click", () => overlay.remove());
  overlay.querySelector(".memories-form-panel").addEventListener("click", (e) => e.stopPropagation());

  const textInput = overlay.querySelector("#memoriesTextInput");
  const impressionInput = overlay.querySelector("#memoriesImpressionInput");
  const dateInput = overlay.querySelector("#memoriesDateInput");
  const timeInput = overlay.querySelector("#memoriesTimeInput");
  const locationInput = overlay.querySelector("#memoriesLocationInput");

  if (existingPage) {
    textInput.value = existingPage.text || "";
    impressionInput.value = existingPage.impression || "";
    dateInput.value = existingPage.date || memoriesToday();
    timeInput.value = existingPage.time || "";
    locationInput.value = existingPage.location || "";
  } else {
    dateInput.value = memoriesToday();
    timeInput.value = memoriesNowTime();
  }

  const getPhoto = memoriesSetupPhotoPicker(overlay, {
    inputId: "memoriesPhotoInput",
    previewId: "memoriesPhotoPreview",
    labelId: "memoriesPhotoPickerLabel",
    labelIdle: "📷 เพิ่มรูปภาพ (ไม่บังคับ)",
    labelBusy: "กำลังประมวลผลรูป...",
    labelChange: "📷 เปลี่ยนรูปภาพ",
    initial: existingPage ? existingPage.photo : "",
  });

  overlay.querySelector("#memoriesFormSubmit").addEventListener("click", () => {
    const text = textInput.value.trim();
    const photo = getPhoto();
    if (!text && !photo) {
      textInput.focus();
      return;
    }
    const page = {
      id: existingPage ? existingPage.id : makeMemoriesId(),
      text,
      photo,
      impression: impressionInput.value.trim(),
      date: dateInput.value || "",
      time: timeInput.value || "",
      location: locationInput.value.trim(),
      createdAt: existingPage ? existingPage.createdAt : Date.now(),
    };
    overlay.remove();
    onSave(page);
  });

  document.body.appendChild(overlay);
  void overlay.offsetHeight;
  overlay.classList.add("show");
}
