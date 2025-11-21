function showToast(title, message, type = "info") {
  const container =
    document.getElementById("toast-container") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <div>
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s forwards";
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 4000);
}

function createToastContainer() {
  const div = document.createElement("div");
  div.id = "toast-container";
  div.className = "toast-container";
  document.body.appendChild(div);
  return div;
}

async function apiFetch(url, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle specific HTTP status codes
      if (res.status === 403) {
        throw new Error(data.message || "You don't have permission to perform this action");
      } else if (res.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      } else if (res.status === 404) {
        throw new Error(data.error || "Resource not found");
      } else if (res.status === 400) {
        throw new Error(data.error || "Invalid request");
      } else {
        throw new Error(data.error || data.message || "An unexpected error occurred");
      }
    }

    return data;
  } catch (error) {
    throw error;
  }
}
