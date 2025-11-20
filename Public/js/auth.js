const API_URL = "";

function showToast(msg, type) {
  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = type === "success" ? "toast-success" : "toast-error";
  toast.innerText = msg;
  document.body.appendChild(toast);
  toast.style.display = "block";
  setTimeout(() => toast.remove(), 3000);
}

function requireAuth() {
  if (!localStorage.getItem("accessToken")) {
    window.location.href = "/login.html";
  }
}

function redirectIfAuth() {
  if (localStorage.getItem("accessToken")) {
    window.location.href = "/dashboard.html";
  }
}

async function loginUser(usernameOrEmail, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("accessToken", data.accessToken);
      window.location.href = "/dashboard.html";
    } else {
      showToast(data.error || "Login failed", "error");
    }
  } catch (err) {
    showToast("Server Error", "error");
  }
}

async function signupUser(name, username, email, password) {
  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("accessToken", data.accessToken);
      window.location.href = "/dashboard.html";
    } else {
      showToast(data.error || "Signup failed", "error");
    }
  } catch (err) {
    showToast("Server Error", "error");
  }
}

async function logoutUser() {
  try {
    await fetch(`${API_URL}/logout`, { method: "POST" });
    localStorage.removeItem("accessToken");
    window.location.href = "/index.html";
  } catch (err) {
    console.error(err);
  }
}

async function fetchProfile() {
  const token = localStorage.getItem("accessToken");
  try {
    const res = await fetch(`${API_URL}/profile`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return await res.json();
    else {
      logoutUser();
    }
  } catch (err) {
    console.error(err);
  }
}
