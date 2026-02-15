/* =================================================
   LOAD ENTRIES + STATE
================================================= */
let entries = JSON.parse(localStorage.getItem("entries")) || [];
let isAllEntriesOpen = false;
let activeEntry = null;

/* =================================================
   ELEMENTS
================================================= */
const notesGrid = document.getElementById("notesGrid");
const totalEntriesEl = document.getElementById("totalEntries");
const streakEl = document.getElementById("streakCount");
const goalBar = document.getElementById("goalBar");
const goalPercentText = document.getElementById("goalPercentText");
const viewAllBtn = document.getElementById("viewAllEntries");
const themeToggle = document.getElementById("themeToggle");
const userProfile = document.getElementById("userProfile");
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const heroUserName = document.getElementById("heroUserName");

/* =================================================
   TOTAL ENTRIES
================================================= */
if (totalEntriesEl) totalEntriesEl.innerText = entries.length;

/* =================================================
   STREAK
================================================= */
function calculateStreak(entries) {
  if (!entries.length) return 0;

  const dates = [...new Set(
    entries.map(e => new Date(e.date).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff =
      (new Date(dates[i - 1]) - new Date(dates[i])) / (1000*60*60*24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
if (streakEl) streakEl.innerText = calculateStreak(entries) + " Days";

/* =================================================
   UTILS
================================================= */
function stripHTML(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || "";
}

/* =================================================
   RENDER LAST 4 NOTES
================================================= */
function renderNotes() {
  if (!notesGrid) return;

  notesGrid.innerHTML = "";
  if (!entries.length) {
    notesGrid.innerHTML = `<p style="opacity:.6">No entries yet 🌙</p>`;
    return;
  }

  entries.slice(-4).reverse().forEach(entry => {
    const div = document.createElement("div");
    div.className = "note-card";

    div.innerHTML = `
      <span class="note-date">${entry.date}</span>
      <h4>${entry.title || "Untitled Entry"}</h4>
      <p>${stripHTML(entry.content).slice(0,120)}...</p>
      <div class="note-actions">
        <button class="delete-btn">🗑 Delete</button>
      </div>
    `;

    div.onclick = () => openEntry(entry);

    div.querySelector(".delete-btn").onclick = (e) => {
      e.stopPropagation();
      if (!confirm("Delete this entry permanently?")) return;

      entries = entries.filter(e =>
        !(e.date === entry.date && e.content === entry.content)
      );
      localStorage.setItem("entries", JSON.stringify(entries));
      renderNotes();
      totalEntriesEl.innerText = entries.length;
    };

    notesGrid.appendChild(div);
  });
}
renderNotes();

/* =================================================
   RENDER ALL NOTES
================================================= */
function renderAllNotes() {
  if (!notesGrid) return;

  notesGrid.innerHTML = "";
  if (!entries.length) {
    notesGrid.innerHTML = `<p style="opacity:.6">No entries yet 🌙</p>`;
    return;
  }

  entries.slice().reverse().forEach(entry => {
    const div = document.createElement("div");
    div.className = "note-card";

    div.innerHTML = `
      <span class="note-date">${entry.date}</span>
      <h4>${entry.title || "Untitled Entry"}</h4>
      <p>${stripHTML(entry.content).slice(0,160)}...</p>
    `;

    div.onclick = () => openEntry(entry);
    notesGrid.appendChild(div);
  });
}

/* =================================================
   VIEW ALL / CLOSE TOGGLE
================================================= */
viewAllBtn?.addEventListener("click", () => {
  isAllEntriesOpen = !isAllEntriesOpen;
  if (isAllEntriesOpen) {
    renderAllNotes();
    viewAllBtn.innerText = "❌ Close Entries";
  } else {
    renderNotes();
    viewAllBtn.innerText = "📖 View All Entries";
  }
});

/* =================================================
   MODAL (Calendar-style)
================================================= */
function openEntry(entry){
  activeEntry = entry;

  document.getElementById("fullTitle").innerText =
    entry.title || "Untitled Entry";

  document.getElementById("fullDate").innerText =
    new Date(entry.date).toDateString();

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

  editBtn?.addEventListener("click", () => {
    const index = entries.findIndex(e =>
      e.date === activeEntry.date && e.content === activeEntry.content
    );
    if(index !== -1){
      localStorage.setItem("editIndex", index);
      location.href = "./write/write.html";
    }
  });

  deleteBtn?.addEventListener("click", () => {
    if(!confirm("Delete this entry permanently?")) return;

    entries = entries.filter(e =>
      !(e.date === activeEntry.date && e.content === activeEntry.content)
    );
    localStorage.setItem("entries", JSON.stringify(entries));
    closeEntry();
    isAllEntriesOpen ? renderAllNotes() : renderNotes();
    totalEntriesEl.innerText = entries.length;
  });
}

/* =================================================
   WEEKLY GOAL
================================================= */
const WEEKLY_GOAL = 5;
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0,0,0,0);
  return d;
}
function calculateWeeklyProgress(entries) {
  const start = getStartOfWeek(new Date());
  const days = new Set();
  entries.forEach(e => {
    const d = new Date(e.date);
    if (d >= start) days.add(d.toDateString());
  });
  return days.size;
}
if (goalBar && goalPercentText) {
  const weeklyCount = calculateWeeklyProgress(entries);
  const percent = Math.round((weeklyCount / WEEKLY_GOAL) * 100);
  goalBar.style.width = Math.min(percent, 100) + "%";
  goalPercentText.innerText =
    percent >= 100
      ? "🎉 You’ve completed your weekly goal!"
      : `You’re ${percent}% of the way to your weekly goal`;
}

/* =================================================
   DATE + GREETING
================================================= */
function updateTimeGreeting() {
  const dateEl = document.getElementById("dateText");
  const greetEl = document.getElementById("greeting");
  if (!dateEl || !greetEl) return;

  const now = new Date();
  dateEl.innerText = now.toLocaleDateString("en-IN", {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });

  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2,"0");

  let greet = "Good Night 🌙";
  if (h < 12) greet = "Good Morning ☀️";
  else if (h < 17) greet = "Good Afternoon 🌤️";
  else if (h < 21) greet = "Good Evening 🌆";

  greetEl.innerText = `${greet} | Time: ${h}:${m}`;
}
updateTimeGreeting();
setInterval(updateTimeGreeting, 60000);

/* =================================================
   THEME
================================================= */
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  if (themeToggle) themeToggle.innerText = "☀ Light Mode";
}
themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.innerText = isDark ? "☀ Light Mode" : "🌙 Dark Mode";
});

/* =================================================
   USER PROFILE
================================================= */
let currentUser = localStorage.getItem("currentUser");
try{ currentUser = JSON.parse(currentUser); }
catch{ currentUser = { name: currentUser }; }

if(currentUser && userNameEl){
  userNameEl.innerText = currentUser.name || "User";
}
if(heroUserName){
  heroUserName.textContent = currentUser?.name ? currentUser.name + "," : "";
}

userProfile?.addEventListener("click", (e) => {
  e.stopPropagation();
  userProfile.classList.toggle("active");
});
logoutBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  if(!confirm("Are you sure you want to logout?")) return;
  localStorage.removeItem("currentUser");
  location.href = "./auth/login.html";
});
document.addEventListener("click", (e) => {
  if(userProfile && !userProfile.contains(e.target)){
    userProfile.classList.remove("active");
  }
});

/* =================================================
   CLEAR ALL NOTES
================================================= */
function clearAllNotes(){
  if(confirm("Are you sure you want to delete all notes?")){
    localStorage.removeItem("entries");
    location.reload();
  }
}
/* =================================================
   WEEKLY STREAK GRAPH (MON → SUN)
================================================= */
function updateWeeklyStreak() {
  const bars = document.querySelectorAll(".streak-graph .bars span");
  if (!bars.length) return;

  const today = new Date();
  today.setHours(0,0,0,0);

  const start = new Date(today);
  const day = start.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  start.setDate(start.getDate() + diff);

  const entryDays = new Set(
    entries.map(e => {
      const d = new Date(e.date);
      d.setHours(0,0,0,0);
      return d.getTime();
    })
  );

  bars.forEach((bar, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    d.setHours(0,0,0,0);

    if (entryDays.has(d.getTime())) {
      bar.style.setProperty("--h", "90%");
      bar.style.opacity = "1";
    } else {
      bar.style.setProperty("--h", "22%");
      bar.style.opacity = "0.25";
    }
  });
}

document.addEventListener("DOMContentLoaded", updateWeeklyStreak);
updateWeeklyStreak();
