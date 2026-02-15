const users = JSON.parse(localStorage.getItem("users")) || {};
const msg = document.getElementById("authMsg");

function register() {
  const u = username.value.trim();
  const p = password.value.trim();

  if (!u || !p) {
    msg.innerText = "Fill all fields";
    return;
  }

  if (users[u]) {
    msg.innerText = "User already exists";
    return;
  }

  users[u] = {
    password: btoa(p),   // simple encoding
    entries: []
  };

  localStorage.setItem("users", JSON.stringify(users));
  msg.innerText = "Registered! Now login.";
}

function login() {
  const u = username.value.trim();
  const p = password.value.trim();

  if (!users[u] || users[u].password !== btoa(p)) {
    msg.innerText = "Invalid credentials";
    return;
  }

  localStorage.setItem("currentUser", u);
  location.href = "../index.html";
}
