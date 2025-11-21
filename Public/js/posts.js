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

      // Helper to check permissions
      const hasPermission = (permissionName) => {
        if (!currentUser || !currentUser.Roles) return false;
        return currentUser.Roles.some(role => 
          role.Permissions && role.Permissions.some(perm => perm.name === permissionName)
        );
      };

      // Show dashboard link if user has dashboard.read permission
      if (hasPermission("dashboard.read")) {
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
    
    if (res.status === 401 || res.status === 403) {
       document.getElementById("postsContent").innerHTML = 
         '<div class="no-posts">You do not have permission to view posts. Please <a href="login.html">login</a> with an authorized account.</div>';
       return;
    }

    if (!res.ok) {
       // Handle other errors or generic failure
       throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }

    const posts = await res.json();

    if (!Array.isArray(posts)) {
       throw new Error("Invalid response format");
    }

    const container = document.getElementById("postsContent");

    if (posts.length === 0) {
      container.innerHTML = '<div class="no-posts">No posts available yet.</div>';
      return;
    }

    // Filter to only show published posts for non-admin users
    // Note: API now enforces posts.read, so if we are here, we have permission.
    // But we might still want to filter drafts if the user only has posts.read but not posts.update (editor/admin usually see all)
    // For simplicity, let's assume posts.read allows seeing all posts returned by API.
    // However, the API getAllPosts returns ALL posts. 
    // Ideally, the API should filter based on permission, or we filter here.
    // Let's keep the client-side filter for now, but update the condition.
    
    let displayPosts = posts;
    // Check if user has "posts.update" or "posts.delete" (implies admin/editor capabilities) to see drafts
    // Or just check if they are admin/editor role for legacy compatibility, OR check permissions.
    // Let's use permission check if we can access currentUser here.
    // currentUser is global.
    
    const canManagePosts = currentUser && currentUser.Roles.some(role => 
        role.Permissions && role.Permissions.some(p => ["posts.update", "posts.delete"].includes(p.name))
    );

    if (!canManagePosts) {
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
