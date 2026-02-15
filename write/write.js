/* =========================
   GLOBALS
========================= */

let editingIndex = null;
let selectedMood = "";

/* =========================
   TIME & DATE
========================= */

function updateMeta(){
  const now = new Date();
  document.getElementById("time").innerText =
    now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  document.getElementById("date").innerText =
    now.toDateString();
}
updateMeta();
setInterval(updateMeta, 60000);

/* =========================
   TOOLBAR COMMANDS
========================= */

function cmd(command, value = null){
  document.execCommand(command, false, value);
  syncToolbar();
}

function syncToolbar(){
  document.querySelectorAll(".toolbar button").forEach(btn => {
    const text = btn.innerText.trim();
    let cmdName = null;

    if(text === "B") cmdName = "bold";
    if(text === "I") cmdName = "italic";
    if(text === "U") cmdName = "underline";
    if(text === "•") cmdName = "insertUnorderedList";

    if(!cmdName) return;

    try{
      btn.classList.toggle("active", document.queryCommandState(cmdName));
    }catch(e){}
  });
}

document.addEventListener("selectionchange", () => {
  const editor = document.getElementById("editor");
  if(editor && editor.contains(document.activeElement)){
    syncToolbar();
  }
});

/* =========================
   MOOD SELECT
========================= */

function selectMood(el){
  document.querySelectorAll(".moods span").forEach(m => m.classList.remove("active"));
  el.classList.add("active");
  selectedMood = el.innerText;
}

/* =========================
   TAGS
========================= */

function addTag(){
  const tag = prompt("Enter tag");
  if(!tag) return;

  const span = document.createElement("span");
  span.innerText = tag;
  document.getElementById("tags").appendChild(span);
}

/* =========================
   SAVE / UPDATE ENTRY
========================= */

function saveEntry(){
  const entries = JSON.parse(localStorage.getItem("entries")) || [];

  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("editor").innerHTML.trim();

  if(!content){
    alert("Entry is empty!");
    return;
  }

  const moodEl = document.querySelector(".moods span.active");
  const mood = moodEl ? moodEl.innerText : "";

  const tags = [];
  document.querySelectorAll("#tags span").forEach(s => tags.push(s.innerText));

  const entryData = {
    title,
    content,
    mood,
    tags,
    date: new Date().toDateString(),
    time: new Date().toLocaleTimeString()
  };

  if(editingIndex !== null){
    entries[editingIndex] = { ...entries[editingIndex], ...entryData };
  }else{
    entries.push(entryData);
  }

  localStorage.setItem("entries", JSON.stringify(entries));
  editingIndex = null;

  // remove edit badge if exists
  const badge = document.querySelector(".edit-badge");
  if(badge) badge.remove();

  location.href = "../calendar/calendar.html";
}

/* =========================
   LOAD EDIT ENTRY
========================= */

function loadEditEntry(){
  const index = localStorage.getItem("editIndex");
  if(index === null) return;

  const entries = JSON.parse(localStorage.getItem("entries")) || [];
  const entry = entries[index];
  if(!entry) return;

  editingIndex = index;
  showEditBadge();

  document.getElementById("title").value = entry.title || "";
  document.getElementById("editor").innerHTML = entry.content || "";

  if(entry.mood){
    document.querySelectorAll(".moods span").forEach(span => {
      const active = span.innerText.includes(entry.mood);
      span.classList.toggle("active", active);
      if(active) selectedMood = entry.mood;
    });
  }

  const tagsBox = document.getElementById("tags");
  tagsBox.innerHTML = "";
  if(entry.tags){
    entry.tags.forEach(tag => {
      const span = document.createElement("span");
      span.innerText = tag;
      tagsBox.appendChild(span);
    });
  }

  localStorage.removeItem("editIndex");
}

/* =========================
   WORD COUNT
========================= */

const editorEl = document.getElementById("editor");
const wordCountEl = document.getElementById("wordCount");

editorEl.addEventListener("input", () => {
  const text = editorEl.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const mins = Math.max(1, Math.ceil(words / 200));
  wordCountEl.innerText = `${words} words • ${mins} min read`;
});

/* =========================
   PDF EXPORT
========================= */

function exportPDF(){
  const win = window.open("", "", "width=800,height=600");
  win.document.write(`
    <html>
    <head>
      <title>${title.value}</title>
      <style>
        body{font-family:Georgia;padding:40px;}
      </style>
    </head>
    <body>
      <h1>${title.value}</h1>
      ${editorEl.innerHTML}
    </body>
    </html>
  `);
  win.document.close();
  win.print();
}

/* =========================
   DRAFT AUTOSAVE
========================= */

setInterval(() => {
  localStorage.setItem("draft", JSON.stringify({
    title: title.value,
    content: editorEl.innerHTML
  }));
}, 3000);

/* =========================
   SHORTCUTS
========================= */

document.addEventListener("keydown", e => {
  if(e.ctrlKey && e.key === "s"){
    e.preventDefault();
    saveEntry();
  }
  if(e.ctrlKey && e.key === "b") cmd("bold");
});

/* =========================
   THEME
========================= */

const themeToggle = document.getElementById("themeToggle");
if(localStorage.getItem("theme") === "dark"){
  document.body.classList.add("dark");
  themeToggle.innerText = "☀ Light Mode";
}

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  themeToggle.innerText = dark ? "☀ Light Mode" : "🌙 Dark Mode";
};

/* =========================
   EDIT BADGE
========================= */

function showEditBadge(){
  const meta = document.querySelector(".top-bar .meta");
  if(!meta || document.querySelector(".edit-badge")) return;

  const badge = document.createElement("span");
  badge.className = "edit-badge";
  badge.innerText = "✏ Editing Entry";

  meta.appendChild(badge);
}

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
  loadEditEntry();
});
/* =========================
   TOOLBAR (FIXED)
========================= */

const editor = document.getElementById("editor");
const toolbarButtons = document.querySelectorAll(".toolbar button");

// button click
toolbarButtons.forEach(btn => {
  btn.addEventListener("mousedown", e => {
    e.preventDefault(); // 🔥 focus loss रोकता है

    const cmd = btn.dataset.cmd;
    if(!cmd) return;

    editor.focus(); // 🔥 cursor वापस editor में
    document.execCommand(cmd, false, null);

    syncToolbar();
  });
});

// real-time active sync
function syncToolbar(){
  toolbarButtons.forEach(btn => {
    const cmd = btn.dataset.cmd;
    try{
      const isActive = document.queryCommandState(cmd);
      btn.classList.toggle("active", isActive);
    }catch(e){}
  });
}

// cursor move / selection change
document.addEventListener("selectionchange", () => {
  if(editor.contains(document.activeElement)){
    syncToolbar();
  }
});


function goBack() {
  // browser history me pichhle page par jayega
  window.history.back();
}
let focusMode = false;

let isFocus = false;

function toggleFocus(){
  isFocus = !isFocus;

  if(isFocus){
    document.documentElement.requestFullscreen();
    document.body.classList.add("focus-mode");
  }else{
    document.exitFullscreen();
  }

  updateFocusBtn();
}

function updateFocusBtn(){
  const btn = document.querySelector(".focus-btn");
  btn.innerText = isFocus ? "❌ Exit Focus" : "🎯 Focus";
}

document.addEventListener("fullscreenchange", () => {
  if(!document.fullscreenElement){
    isFocus = false;
    document.body.classList.remove("focus-mode");
    updateFocusBtn();
  }
});


const userProfile = document.getElementById("userProfile");
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");

// Load user
let currentUser = localStorage.getItem("currentUser");

try{
  currentUser = JSON.parse(currentUser);
}catch(e){
  currentUser = { name: currentUser };
}

if(currentUser && userNameEl){
  userNameEl.innerText = currentUser.name || "User";
}



if(currentUser && userNameEl){
  userNameEl.innerText = currentUser.name || "User";
}

// Toggle menu (IMPORTANT FIX)
userProfile?.addEventListener("click", (e) => {
  e.stopPropagation();      // 🔥 prevents instant close
  userProfile.classList.toggle("active");
});

// Logout
logoutBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  if(!confirm("Are you sure you want to logout?")) return;

  localStorage.removeItem("currentUser");
  location.href = "./auth/login.html";
});

// Close on outside click
document.addEventListener("click", (e) => {
  if(userProfile && !userProfile.contains(e.target)){
    userProfile.classList.remove("active");
  }
});


if (!localStorage.getItem("currentUser")) {
    location.href = "./auth/login.html";
  }
