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
      const navLinks = document.getElementById("navLinks");
      if(navLinks) {
          navLinks.innerHTML = `
            <a href="#" class="nav-item" id="logoutBtn">
                <span>🚪</span> Logout
            </a>
          `;
          document.getElementById("logoutBtn").addEventListener("click", async (e) => {
            e.preventDefault();
            await logoutUser();
            window.location.href = "index.html";
          });
      }
    } else {
        // Not logged in
        const navLinks = document.getElementById("navLinks");
        if(navLinks) {
            navLinks.innerHTML = `
                <a href="login.html" class="nav-item"><span>🔑</span> Login</a>
                <a href="signup.html" class="nav-item"><span>✨</span> Sign Up</a>
            `;
        }
    }
  } catch (e) {
    console.error(e);
  }

  // Load post
  loadPost();
})();

async function loadPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const container = document.getElementById("postContainer");

  if (!slug) {
    container.innerHTML = "<p>Post not found.</p>";
    return;
  }

  try {
    const res = await fetch(`/posts/slug/${slug}`);
    
    if (res.status === 401 || res.status === 403) {
        container.innerHTML = `
          <div style="text-align:center; padding: 60px;">
              <h2>🔒 Access Restricted</h2>
              <p>You need to be logged in with appropriate permissions to view this story.</p>
              <a href="login.html" class="btn-ceramic" style="margin-top:20px; display:inline-block;">Login Now</a>
          </div>`;
        return;
    }

    if (!res.ok) {
        container.innerHTML = "<p>Post not found.</p>";
        return;
    }

    const post = await res.json();

    // Format content with drop cap for the first paragraph
    // Simple heuristic: wrap first letter of first p tag if it exists, or just first letter of content
    // Since content is likely plain text or simple HTML from textarea, let's just apply class to container
    // and let CSS handle it if we can target ::first-letter of first p.
    // But if content is just text, we might need to wrap it.
    
    // Assuming content is plain text with newlines for now, or basic HTML.
    // Let's wrap it in paragraphs.
    const contentHtml = post.content.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');

    container.innerHTML = `
      <article>
        <header style="margin-bottom: 40px; text-align: center;">
            <div style="margin-bottom: 16px;">
                <span class="post-tag">${post.status}</span>
            </div>
            <h1 style="font-size: 3rem; line-height: 1.1; margin-bottom: 24px; letter-spacing: -0.03em;">${post.title}</h1>
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; color: var(--text-secondary);">
                <span>By ${post.User?.name || "Unknown"}</span>
                <span>•</span>
                <span>${new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
        </header>

        ${
          post.featuredImage
            ? `<div style="margin-bottom: 40px; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-lg);">
                <img src="${post.featuredImage}" alt="${post.title}" style="width: 100%; height: auto; display: block;">
               </div>`
            : ""
        }

        <div class="post-content drop-cap">
            ${contentHtml}
        </div>
        
        <div style="margin-top: 60px; padding-top: 40px; border-top: 1px solid var(--border);">
            <a href="posts.html" class="btn-outline">← Back to all stories</a>
        </div>
      </article>
    `;
  } catch (error) {
    console.error("Error loading post:", error);
    container.innerHTML = "<p>Error loading post.</p>";
  }
}
