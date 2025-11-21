// Posts page functionality
let currentUser = null;

async function initPostsPage() {
  // Check authentication and update nav
  try {
    currentUser = await fetchProfile();
    if (currentUser) {
      document.getElementById("loginLink").style.display = "none";
      document.getElementById("signupLink").style.display = "none";
      document.getElementById("logoutBtn").style.display = "inline-block";

      // Show dashboard link if user has admin or editor role
      const roles = currentUser.Roles.map((r) => r.name);
      if (roles.includes("admin") || roles.includes("editor")) {
        const dashboardLink = document.getElementById("dashboardLink");
        dashboardLink.style.display = "inline-block";
        dashboardLink.href = "dashboard.html";
      }
    }
  } catch (e) {
    // User not logged in, that's okay
  }

  // Setup logout
  document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await logoutUser();
    window.location.href = "/index.html";
  });

  // Load posts
  loadAllPosts();
}

async function loadAllPosts() {
  try {
    const res = await fetch("/posts");
    const posts = await res.json();

    const container = document.getElementById("postsContent");

    if (posts.length === 0) {
      container.innerHTML = '<div class="no-posts">No posts available yet.</div>';
      return;
    }

    // Filter to only show published posts for non-admin users
    let displayPosts = posts;
    if (!currentUser || !currentUser.Roles.some((r) => ["admin", "editor"].includes(r.name))) {
      displayPosts = posts.filter((p) => p.status === "published");
    }

    if (displayPosts.length === 0) {
      container.innerHTML = '<div class="no-posts">No published posts available yet.</div>';
      return;
    }

    container.innerHTML = `
      <div class="posts-grid">
        ${displayPosts
          .map(
            (post) => `
          <a href="post.html?slug=${post.slug}" style="text-decoration: none; color: inherit;">
            <div class="post-card">
              ${
                post.featuredImage
                  ? `<img src="${post.featuredImage}" alt="${post.title}" class="post-image" onerror="this.style.display='none'">`
                  : ""
              }
              <h2 class="post-title">${post.title}</h2>
              <div class="post-meta">
                <span>By ${post.User?.name || "Unknown"}</span>
                <span>•</span>
                <span>${new Date(post.createdAt).toLocaleDateString()}</span>
                <span class="post-status status-${post.status}">${post.status}</span>
              </div>
              <p class="post-excerpt">${truncateText(post.content, 150)}</p>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
    `;
  } catch (error) {
    console.error("Error loading posts:", error);
    document.getElementById("postsContent").innerHTML =
      '<div class="no-posts">Failed to load posts. Please try again later.</div>';
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", initPostsPage);
