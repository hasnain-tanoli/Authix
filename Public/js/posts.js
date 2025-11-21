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

  // Load all posts
  loadAllPosts();
})();

// Logout Handler
document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  await logoutUser();
  window.location.href = "index.html";
});

async function loadAllPosts() {
  try {
    const res = await fetch("/posts");
    const container = document.getElementById("postsContent");

    if (res.status === 401 || res.status === 403) {
      container.innerHTML = `
        <div class="bento-card span-12" style="text-align:center; padding: 60px;">
            <h2>🔒 Access Restricted</h2>
            <p>You need to be logged in with appropriate permissions to view these stories.</p>
            <a href="login.html" class="btn-ceramic" style="margin-top:20px; display:inline-block;">Login Now</a>
        </div>`;
      return;
    }

    if (!res.ok) {
        container.innerHTML = '<div class="bento-card span-12"><p>Failed to load posts.</p></div>';
        return;
    }

    const posts = await res.json();
    
    if (!Array.isArray(posts)) {
        container.innerHTML = '<div class="bento-card span-12"><p>No posts found.</p></div>';
        return;
    }

    const publishedPosts = posts.filter((p) => p.status === "published");

    if (publishedPosts.length === 0) {
      container.innerHTML = '<div class="bento-card span-12"><p>No stories published yet.</p></div>';
      return;
    }

    container.innerHTML = publishedPosts
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
    console.error("Error loading posts:", error);
    document.getElementById("postsContent").innerHTML = '<div class="bento-card span-12"><p>Error loading content.</p></div>';
  }
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
