// Check if user is authenticated and update navigation
(async () => {
  try {
    const user = await fetchProfile();
    if (user) {
      // User is logged in, update nav
      const navLinks = document.querySelector(".nav-links");
      const ctaButtons = document.getElementById("ctaButtons");
      const roles = user.Roles.map((r) => r.name);
      
      // Update navigation based on roles
      if (roles.includes("admin") || roles.includes("editor")) {
        navLinks.innerHTML = `
          <a href="posts.html" class="nav-btn btn-outline">Posts</a>
          <a href="dashboard.html" class="nav-btn btn-outline">Dashboard</a>
          <a href="javascript:void(0);" class="nav-btn btn-fill logout-btn">Logout</a>
        `;
        
        // Update CTA buttons for admin/editor
        ctaButtons.innerHTML = `
          <a href="posts.html" class="nav-btn btn-fill">View Posts</a>
          <a href="dashboard.html" class="nav-btn btn-outline">Go to Dashboard</a>
        `;
      } else {
        // Regular user - only show posts and logout
        navLinks.innerHTML = `
          <a href="posts.html" class="nav-btn btn-outline">Posts</a>
          <a href="javascript:void(0);" class="nav-btn btn-fill logout-btn">Logout</a>
        `;
        
        // Update CTA buttons for regular user
        ctaButtons.innerHTML = `
          <a href="posts.html" class="nav-btn btn-fill">View Posts</a>
          <a href="javascript:void(0);" class="nav-btn btn-outline logout-btn">Logout</a>
        `;
      }
    }
  } catch (e) {
    // User not logged in, keep default nav and buttons
  }

  // Load recent posts
  loadRecentPosts();
})();

// Global event listener for logout buttons
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("logout-btn")) {
    e.preventDefault();
    e.stopPropagation();
    await logoutUser();
  }
});

async function loadRecentPosts() {
  try {
    const res = await fetch("/posts");
    const posts = await res.json();
    
    // Filter published posts and get latest 3
    const recentPosts = posts
      .filter((p) => p.status === "published")
      .slice(0, 3);

    if (recentPosts.length === 0) return;

    // Find the CTA buttons section and add posts before it
    const ctaButtons = document.querySelector(".cta-buttons");
    const postsSection = document.createElement("div");
    postsSection.className = "recent-posts";
    postsSection.innerHTML = `
      <h2 style="color: #fff; font-size: 2rem; margin-bottom: 30px; text-align: center;">Recent Posts</h2>
      <div class="posts-grid">
        ${recentPosts
          .map(
            (post) => `
          <div class="post-card">
            ${
              post.featuredImage
                ? `<img src="${post.featuredImage}" alt="${post.title}" class="post-image" onerror="this.style.display='none'">`
                : ""
            }
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">
              <span>By ${post.User?.name || "Unknown"}</span>
              <span>•</span>
              <span>${new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <p class="post-excerpt">${truncateText(post.content, 100)}</p>
          </div>
        `
          )
          .join("")}
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <a href="posts.html" class="nav-btn btn-outline">View All Posts</a>
      </div>
    `;

    ctaButtons.parentNode.insertBefore(postsSection, ctaButtons.nextSibling);

    // Add styles for posts
    const style = document.createElement("style");
    style.textContent = `
      .recent-posts {
        margin-top: 60px;
        width: 100%;
      }

      .posts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 30px;
        margin-top: 30px;
      }

      .post-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 25px;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .post-card:hover {
        transform: translateY(-5px);
        border-color: rgba(102, 126, 234, 0.5);
        box-shadow: 0 10px 40px rgba(102, 126, 234, 0.2);
      }

      .post-image {
        width: 100%;
        height: 180px;
        object-fit: cover;
        border-radius: 12px;
        margin-bottom: 15px;
      }

      .post-title {
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 10px;
        color: #fff;
      }

      .post-meta {
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
        font-size: 0.8rem;
        color: #94a3b8;
      }

      .post-excerpt {
        color: #cbd5e1;
        line-height: 1.6;
        font-size: 0.95rem;
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error("Error loading recent posts:", error);
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
