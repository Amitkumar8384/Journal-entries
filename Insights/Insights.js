/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     LOAD DATA
  ========================= */
  const entries = JSON.parse(localStorage.getItem("entries")) || [];

  /* =========================
     ELEMENTS
  ========================= */
  const totalEntriesEl = document.getElementById("totalEntries");
  const currentStreakEl = document.getElementById("currentStreak");
  const longestStreakEl = document.getElementById("longestStreak");
  const consistencyEl = document.getElementById("consistency");

  const monthlyActivityEl = document.getElementById("monthlyActivity");
  const moodStatsEl = document.getElementById("moodStats");
  const aiInsightsEl = document.getElementById("aiInsights");

  const badgeEntries = document.getElementById("badgeEntries");
  const badgeStreak = document.getElementById("badgeStreak");

  /* =========================
     BASIC STATS
  ========================= */
  if (totalEntriesEl) totalEntriesEl.innerText = entries.length;

  /* =========================
     STREAK CALCULATION
  ========================= */
  function calculateStreaks() {
    if (!entries.length) return { current: 0, longest: 0 };

    const dates = [...new Set(
      entries.map(e => new Date(e.date).toDateString())
    )].map(d => new Date(d)).sort((a, b) => b - a);

    let longest = 1;
    let temp = 1;

    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i - 1] - dates[i]) / 86400000;
      if (diff === 1) {
        temp++;
        longest = Math.max(longest, temp);
      } else temp = 1;
    }

    const today = new Date().toDateString();
    const current = dates[0].toDateString() === today ? temp : 0;

    return { current, longest };
  }

  const streaks = calculateStreaks();

  if (currentStreakEl) currentStreakEl.innerText = `${streaks.current} days`;
  if (longestStreakEl) longestStreakEl.innerText = `${streaks.longest} days`;

  if (badgeEntries) badgeEntries.innerText = `✍ ${entries.length} entries`;
  if (badgeStreak) badgeStreak.innerText = `🔥 ${streaks.current} day streak`;

  /* =========================
     CONSISTENCY %
  ========================= */
  if (consistencyEl) {
    const now = new Date();
    const daysInMonth =
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const writtenDays = new Set(
      entries.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() &&
               d.getFullYear() === now.getFullYear();
      }).map(e => new Date(e.date).getDate())
    ).size;

    consistencyEl.innerText =
      Math.round((writtenDays / daysInMonth) * 100) + "%";
  }

  /* =========================
     MONTHLY HEATMAP
  ========================= */
  if (monthlyActivityEl) {
    monthlyActivityEl.innerHTML = "";
    const now = new Date();
    const daysInMonth =
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const map = {};
    entries.forEach(e => {
      const d = new Date(e.date);
      if (d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()) {
        const day = d.getDate();
        map[day] = (map[day] || 0) + 1;
      }
    });

    for (let i = 1; i <= daysInMonth; i++) {
      const div = document.createElement("div");
      div.className = "day";
      if (map[i] === 1) div.classList.add("lvl1");
      else if (map[i] === 2) div.classList.add("lvl2");
      else if (map[i] >= 3) div.classList.add("lvl3");
      monthlyActivityEl.appendChild(div);
    }
  }

  /* =========================
     MOOD STATS
  ========================= */
  let moodMap = {};
  if (moodStatsEl) {
    entries.forEach(e => {
      if (!e.mood) return;
      moodMap[e.mood] = (moodMap[e.mood] || 0) + 1;
    });

    const total = Object.values(moodMap).reduce((a, b) => a + b, 0);
    moodStatsEl.innerHTML = "";

    for (const mood in moodMap) {
      const percent = Math.round((moodMap[mood] / total) * 100);
      moodStatsEl.innerHTML += `
        <div style="margin-bottom:10px">
          <div style="font-size:13px">${mood} – ${percent}%</div>
          <div style="height:8px;background:var(--border);border-radius:999px">
            <div style="width:${percent}%;height:100%;background:var(--accent)"></div>
          </div>
        </div>
      `;
    }
  }

  /* =========================
     AI INSIGHTS
  ========================= */
  if (aiInsightsEl) {
    const insights = [];
    if (streaks.current >= 5)
      insights.push("🔥 You are building a strong writing habit");
    if (moodMap.sad && moodMap.happy)
      insights.push(
        moodMap.sad > moodMap.happy
          ? "💛 Writing helps you process emotions"
          : "😊 Positive moods dominate your journal"
      );
    if (entries.length >= 30)
      insights.push("📚 You’ve built a solid writing archive");
    if (!insights.length)
      insights.push("✍️ Keep writing to unlock insights");

    aiInsightsEl.innerHTML =
      "<ul>" + insights.map(i => `<li>${i}</li>`).join("") + "</ul>";
  }

  /* =========================
     BEST TIME & DEPTH
  ========================= */
  const bestTimeEl = document.getElementById("bestTime");
  const totalWordsEl = document.getElementById("totalWords");
  const avgWordsEl = document.getElementById("avgWords");

  let hourMap = {};
  let totalWords = 0;

  entries.forEach(e => {
    if (e.content) {
      totalWords += e.content.replace(/<[^>]*>/g,"").split(/\s+/).length;
    }
    if (e.time) {
      let hour = e.time.includes("PM") || e.time.includes("AM")
        ? (parseInt(e.time) % 12) + (e.time.includes("PM") ? 12 : 0)
        : parseInt(e.time);
      if (!isNaN(hour)) hourMap[hour] = (hourMap[hour] || 0) + 1;
    }
  });

  if (bestTimeEl) {
    const best = Object.keys(hourMap)
      .sort((a,b)=>hourMap[b]-hourMap[a])[0];
    bestTimeEl.innerText = best ? `${best}:00 – ${(+best+1)%24}:00` : "—";
  }

  if (totalWordsEl) totalWordsEl.innerText = totalWords;
  if (avgWordsEl) avgWordsEl.innerText =
    entries.length ? Math.round(totalWords / entries.length) : 0;

  /* =========================
     ACHIEVEMENTS
  ========================= */
  if (entries.length >= 30)
    document.getElementById("entriesBadge")?.classList.add("unlocked");

  if (totalWords >= 10000)
    document.getElementById("wordsBadge")?.classList.add("unlocked");

  if (streaks.current >= 7)
    document.getElementById("streakBadge")?.classList.add("unlocked");

  /* =========================
     THEME TOGGLE
  ========================= */
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


  /* =========================
     USER PROFILE
  ========================= */
  const userProfile = document.getElementById("userProfile");
  const userNameEl = document.getElementById("userName");
  const logoutBtn = document.getElementById("logoutBtn");

  let currentUser = localStorage.getItem("currentUser");
  try { currentUser = JSON.parse(currentUser); }
  catch { currentUser = { name: currentUser }; }

  if (userNameEl)
    userNameEl.innerText = currentUser?.name || "User";

  userProfile?.addEventListener("click", e => {
    e.stopPropagation();
    userProfile.classList.toggle("active");
  });

  logoutBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("currentUser");
      location.href = "./auth/login.html";
    }
  });

  document.addEventListener("click", e => {
    if (userProfile && !userProfile.contains(e.target))
      userProfile.classList.remove("active");
  });

});
