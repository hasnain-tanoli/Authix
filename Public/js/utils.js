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
      throw new Error(data.error || "An unexpected error occurred");
    }

    return data;
  } catch (error) {
    throw error;
  }
}
