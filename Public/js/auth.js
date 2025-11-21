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

async function requireAuth() {
  try {
    const res = await fetch(`${API_URL}/profile`);
    if (!res.ok) {
      window.location.href = "/login.html";
    }
  } catch (e) {
    window.location.href = "/login.html";
  }
}

async function redirectIfAuth() {
  try {
    const res = await fetch(`${API_URL}/profile`);
    if (res.ok) {
      window.location.href = "/dashboard.html";
    }
  } catch (e) {
    // Not authenticated, stay here
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
    window.location.href = "/index.html";
  } catch (err) {
    console.error(err);
  }
}

async function fetchProfile() {
  try {
    const res = await fetch(`${API_URL}/profile`, {
      method: "GET",
    });
    if (res.ok) return await res.json();
    else {
      logoutUser();
    }
  } catch (err) {
    console.error(err);
  }
}
