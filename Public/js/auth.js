const API_URL = "";

// Helper: Toast Notification
function showToast(title, message, type = "info") {
  // Handle legacy calls (msg, type)
  if (arguments.length === 2 && (message === "success" || message === "error")) {
      type = message;
      message = title;
      title = type === "success" ? "Success" : "Error";
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-header">
      <strong>${title}</strong>
      <button onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="toast-body">${message}</div>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add("show"), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Helper: API Fetch Wrapper
async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle 401 - Token expired, redirect to login
    if (response.status === 401) {
      showToast("Session Expired", "Please login again", "error");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1500);
      throw new Error("Session expired");
    }

    // Handle 403 - Unauthorized access, redirect to unauthorized page
    if (response.status === 403) {
      window.location.href = "/unauthorized.html";
      throw new Error("Access denied");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    if (error.message !== "Session expired" && error.message !== "Access denied") {
      showToast("Error", error.message, "error");
    }
    throw error;
  }
}

async function requireAuth() {
  try {
    const res = await fetch(`${API_URL}/profile`);
    if (res.status === 401 || res.status === 403) {
      window.location.href = "/login.html";
      return;
    }
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
      window.location.href = "/index.html";
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
      showToast("Success", "Login successful", "success");
      window.location.href = "/index.html";
    } else {
      showToast("Error", data.error || "Login failed", "error");
    }
  } catch (err) {
    showToast("Error", "Server Error", "error");
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
      showToast("Success", "Account created successfully", "success");
      window.location.href = "/index.html";
    } else {
      showToast("Error", data.error || "Signup failed", "error");
    }
  } catch (err) {
    showToast("Error", "Server Error", "error");
  }
}

async function logoutUser() {
  try {
    await fetch(`${API_URL}/logout`, { method: "POST" });
    window.location.href = "/login.html";
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
    return null;
  } catch (err) {
    return null;
  }
}
