// Check if user is authenticated and update sidebar visibility
(async () => {
  try {
    const user = await fetchProfile();
    if (user) {
      // Show Dashboard link if authorized
      const hasDashboardAccess = user.Roles.some(role => 
        role.Permissions && role.Permissions.some(perm => perm.name === "dashboard.read")
      );
      
      if (hasDashboardAccess) {
        document.getElementById("dashboardLink").style.display = "flex";
      }

      // Toggle Auth Links
      document.getElementById("loginLink").style.display = "none";
      document.getElementById("signupLink").style.display = "none";
      document.getElementById("logoutBtn").style.display = "flex";
    }
  } catch (e) {
    // Not logged in, keep defaults
  }

  // Load recent posts
  loadRecentPosts();
})();

// Logout Handler
document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  await logoutUser(); // This already redirects to login.html and clears cache
});

async function loadRecentPosts() {
  try {
    const res = await fetch("/posts");
    if (!res.ok) return; 

    const posts = await res.json();
    if (!Array.isArray(posts)) return;

    // Filter published posts and get latest 3
    const recentPosts = posts
      .filter((p) => p.status === "published")
      .slice(0, 3);

    const container = document.getElementById("recentPosts");
    if (!container) return;

    if (recentPosts.length === 0) {
      container.innerHTML = '<div class="bento-card span-12"><p>No recent stories found.</p></div>';
      return;
    }

    container.innerHTML = recentPosts
      .map(
        (post) => `
      <a href="post.html?slug=${post.slug}" class="post-card-minimal">
        <div class="post-image-wrapper">
            ${
              post.featuredImage
                ? `<img src="${post.featuredImage}" alt="${post.title}" class="post-image-minimal" onerror="this.style.display='none'">`
                : `<div style="width:100%; height:100%; background:var(--border); display:flex; align-items:center; justify-content:center; color:var(--text-tertiary);">No Image</div>`
            }
        </div>
        <div class="post-content-minimal">
            <span class="post-tag">${post.status}</span>
            <h3 style="margin-bottom: 12px; font-size: 1.5rem; line-height: 1.2;">${post.title}</h3>
            <p style="font-size: 0.95rem; margin-bottom: 24px; flex: 1; color: var(--text-secondary);">${truncateText(post.content, 120)}</p>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 0.85rem; color: var(--text-tertiary);">
                <span>${post.User?.name || "Unknown"}</span>
                <span>•</span>
                <span>${new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
      </a>
    `
      )
      .join("");
      
  } catch (error) {
    console.error("Error loading recent posts:", error);
  }
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
