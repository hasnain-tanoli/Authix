// Get post slug from URL
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');

// Update navigation based on authentication
(async () => {
  try {
    const user = await fetchProfile();
    if (user) {
      const navLinks = document.getElementById("navLinks");
      // Helper to check permissions
      const hasPermission = (permissionName) => {
        if (!user || !user.Roles) return false;
        return user.Roles.some(role => 
          role.Permissions && role.Permissions.some(perm => perm.name === permissionName)
        );
      };

      const canViewDashboard = hasPermission("dashboard.read");

      // Build Navigation Links
      let navHtml = `<a href="posts.html" class="nav-btn btn-outline">All Posts</a>`;
      
      if (canViewDashboard) {
        navHtml += `<a href="dashboard.html" class="nav-btn btn-outline">Dashboard</a>`;
      }
      
      navHtml += `<a href="javascript:void(0);" class="nav-btn btn-fill logout-btn">Logout</a>`;
      
      navLinks.innerHTML = navHtml;
    }
  } catch (e) {
    // Not logged in, keep default nav
  }
})();

// Global event listener for logout buttons
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("logout-btn")) {
    e.preventDefault();
    e.stopPropagation();
    await logoutUser();
  }
});

// Load and display the post
async function loadPost() {
  const container = document.getElementById("postContainer");
  
  if (!slug) {
    container.innerHTML = `
      <div class="error">
        <h2>Post Not Found</h2>
        <p>No post slug provided in the URL.</p>
        <a href="posts.html" class="back-link">← Back to All Posts</a>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`/posts/slug/${slug}`);
    
    if (response.status === 401 || response.status === 403) {
       container.innerHTML = `
         <div class="error">
           <h2>Access Denied</h2>
           <p>You do not have permission to view this post. Please <a href="login.html">login</a> with an authorized account.</p>
           <a href="posts.html" class="back-link">← Back to All Posts</a>
         </div>
       `;
       return;
    }

    if (!response.ok) {
      throw new Error('Post not found');
    }
    
    const post = await response.json();
    
    // Update page title
    document.title = `${post.title} | Authix`;
    
    // Format date
    const publishDate = new Date(post.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Get status badge class
    const statusClass = `status-${post.status}`;
    
    // Render post
    container.innerHTML = `
      <article>
        <div class="post-header">
          <h1 class="post-title">${post.title}</h1>
          <div class="post-meta">
            <div class="post-meta-item">
              <span>📅</span>
              <span>${publishDate}</span>
            </div>
            <div class="post-meta-item">
              <span>✍️</span>
              <span>${post.User?.name || 'Unknown Author'}</span>
            </div>
            <div class="post-meta-item">
              <span class="status-badge ${statusClass}">${post.status}</span>
            </div>
          </div>
        </div>
        
        ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" class="post-featured-image" />` : ''}
        
        <div class="post-content">${post.content}</div>
        
        <div class="post-footer">
          <a href="posts.html" class="back-link">← Back to All Posts</a>
        </div>
      </article>
    `;
    
  } catch (error) {
    container.innerHTML = `
      <div class="error">
        <h2>Post Not Found</h2>
        <p>The post you're looking for doesn't exist or has been removed.</p>
        <a href="posts.html" class="back-link">← Back to All Posts</a>
      </div>
    `;
  }
}

// Load post when page loads
loadPost();
