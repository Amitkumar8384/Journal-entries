/* =========================
   DATA
========================= */

let entries = JSON.parse(localStorage.getItem("entries")) || [];
let activeEntry = null;

let currentDate = new Date();
let selectedDate = new Date();

/* =========================
   ELEMENTS
========================= */

const monthLabel = document.getElementById("monthLabel");
const calendarDays = document.getElementById("calendarDays");
const selectedDateEl = document.getElementById("selectedDate");
const dayEntries = document.getElementById("dayEntries");
const themeToggle = document.getElementById("themeToggle");

/* =========================
   CALENDAR
========================= */

function renderCalendar(){
  calendarDays.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthLabel.innerText = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Empty slots
  for(let i = 0; i < firstDay; i++){
    calendarDays.appendChild(document.createElement("span"));
  }

  // Days
  for(let d = 1; d <= totalDays; d++){
    const span = document.createElement("span");
    span.innerText = d;

    const dateObj = new Date(year, month, d);
    const dateStr = dateObj.toDateString();

    if(entries.some(e => e.date === dateStr)){
      span.classList.add("has-entry");
    }

    span.onclick = () => {
      selectedDate = dateObj;
      document
        .querySelectorAll(".days span")
        .forEach(s => s.classList.remove("active"));

      span.classList.add("active");
      renderDayEntries();
    };

    calendarDays.appendChild(span);
  }

  highlightToday();
}

/* =========================
   TODAY HIGHLIGHT
========================= */

function highlightToday(){
  const today = new Date();

  if(
    today.getMonth() !== currentDate.getMonth() ||
    today.getFullYear() !== currentDate.getFullYear()
  ) return;

  document.querySelectorAll(".days span").forEach(span => {
    if(span.textContent.trim() === String(today.getDate())){
      span.classList.add("active");
      selectedDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        today.getDate()
      );
    }
  });
}

/* =========================
   DAY ENTRIES
========================= */

function renderDayEntries(){
  const dateStr = selectedDate.toDateString();
  selectedDateEl.innerText = dateStr;
  dayEntries.innerHTML = "";

  const list = entries.filter(e => e.date === dateStr);

  if(!list.length){
    dayEntries.innerHTML = `<p style="opacity:.6">No entries</p>`;
    return;
  }

  list.forEach(entry => {
    const div = document.createElement("div");
    div.className = "entry-card";

    div.innerHTML = `
      <div class="entry-time">${entry.time || ""}</div>
      <div class="entry-title">${entry.title || "Untitled Entry"}</div>
      <p>${entry.content.replace(/<[^>]*>/g,"").slice(0,120)}...</p>
      <div class="entry-actions">
        <button class="edit">✏ Edit</button>
        <button class="delete">🗑 Delete</button>
      </div>
    `;

    div.onclick = (e) => {
      if(e.target.tagName === "BUTTON") return;
      openFullEntry(entry);
    };

    div.querySelector(".edit").onclick = () => {
      localStorage.setItem("editIndex", entries.indexOf(entry));
      location.href = "../write/write.html";
    };

    div.querySelector(".delete").onclick = () => {
      if(!confirm("Delete this entry permanently?")) return;

      entries = entries.filter(e => e !== entry);
      localStorage.setItem("entries", JSON.stringify(entries));
      renderCalendar();
      renderDayEntries();
    };

    dayEntries.appendChild(div);
  });
}

/* =========================
   FULL ENTRY MODAL
========================= */

function openFullEntry(entry){
  activeEntry = entry;

  document.getElementById("fullTitle").innerText =
    entry.title || "Untitled Entry";

  document.getElementById("fullDate").innerText =
    entry.date || "";

  document.getElementById("fullContent").innerHTML =
    entry.content || "";

  document.getElementById("entryModal").classList.remove("hidden");
  bindModalActions();
}

function closeEntry(){
  document.getElementById("entryModal").classList.add("hidden");
}

function bindModalActions(){
  const editBtn = document.querySelector(".modal-edit");
  const deleteBtn = document.querySelector(".modal-delete");

  editBtn && (editBtn.onclick = () => {
    const index = entries.indexOf(activeEntry);
    if(index !== -1){
      localStorage.setItem("editIndex", index);
      location.href = "../write/write.html";
    }
  });

  deleteBtn && (deleteBtn.onclick = () => {
    if(!confirm("Delete this entry permanently?")) return;

    entries = entries.filter(e => e !== activeEntry);
    localStorage.setItem("entries", JSON.stringify(entries));

    closeEntry();
    renderCalendar();
    renderDayEntries();
  });
}

/* =========================
   MONTH CONTROLS
========================= */

function prevMonth(){
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth(){
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

function addEntry(){
  localStorage.setItem("selectedDate", selectedDate.toDateString());
  location.href = "../write/write.html";
}

/* =========================
   SEARCH
========================= */

function searchCalendar(query){
  query = query.toLowerCase().trim();
  dayEntries.innerHTML = "";

  if(!query){
    renderDayEntries();
    return;
  }

  const results = entries.filter(e =>
    (e.title && e.title.toLowerCase().includes(query)) ||
    (e.content && e.content.toLowerCase().includes(query))
  );

  if(!results.length){
    dayEntries.innerHTML = `<p style="opacity:.6">No matching entries</p>`;
    return;
  }

  results.forEach(entry => {
    const div = document.createElement("div");
    div.className = "entry-card";
    div.innerHTML = `
      <div class="entry-time">${entry.time || ""}</div>
      <div class="entry-title">${entry.title || "Untitled Entry"}</div>
      <p>${entry.content.replace(/<[^>]*>/g,"").slice(0,120)}...</p>
    `;
    div.onclick = () => openFullEntry(entry);
    dayEntries.appendChild(div);
  });
}

/* =========================
   THEME
========================= */

function initTheme(){
  if(!themeToggle) return;

  const saved = localStorage.getItem("theme");
  document.body.classList.toggle("dark", saved === "dark");
  themeToggle.innerText =
    saved === "dark" ? "☀ Light Mode" : "🌙 Dark Mode";

  themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.innerText =
      isDark ? "☀ Light Mode" : "🌙 Dark Mode";
  };
}

/* =========================
   USER PROFILE
========================= */

const userProfile = document.getElementById("userProfile");
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = localStorage.getItem("currentUser");
try{ currentUser = JSON.parse(currentUser); }
catch{ currentUser = { name: currentUser }; }

if(currentUser && userNameEl){
  userNameEl.innerText = currentUser.name || "User";
}

userProfile?.addEventListener("click", e => {
  e.stopPropagation();
  userProfile.classList.toggle("active");
});

logoutBtn?.addEventListener("click", e => {
  e.stopPropagation();
  if(confirm("Are you sure you want to logout?")){
    localStorage.removeItem("currentUser");
    location.href = "./auth/login.html";
  }
});

document.addEventListener("click", e => {
  if(userProfile && !userProfile.contains(e.target)){
    userProfile.classList.remove("active");
  }
});

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
  renderDayEntries();
  initTheme();
});

entries.sort((a, b) => {
  const dateA = new Date(`${a.date} ${a.time || ""}`);
  const dateB = new Date(`${b.date} ${b.time || ""}`);
  return dateB - dateA; // NEWEST FIRST
});
