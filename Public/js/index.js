// Check if user is authenticated and update sidebar visibility
(async () => {
  let isAuthenticated = false;
  try {
    const user = await fetchProfile();
    if (user) {
      isAuthenticated = true;
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
    isAuthenticated = false;
  }

  // Load recent posts only if authenticated
  if (isAuthenticated) {
    loadRecentPosts();
  } else {
    showLoginPrompt();
  }
})();

// Logout Handler
document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
  e.preventDefault();
  await logoutUser(); 
});

function showLoginPrompt() {
  const container = document.getElementById("recentPosts");
  if (!container) return;

  container.innerHTML = `
    <div style="
      min-height: calc(100vh - 160px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(61, 90, 241, 0.03) 0%, rgba(61, 90, 241, 0.08) 100%);
      border-radius: var(--radius-lg);
      padding: 80px 60px;
      position: relative;
      overflow: hidden;
    ">
      <!-- Decorative floating elements -->
      <div style="
        position: absolute;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(61, 90, 241, 0.15) 0%, transparent 70%);
        border-radius: 50%;
        top: -150px;
        right: -150px;
        pointer-events: none;
      "></div>
      <div style="
        position: absolute;
        width: 350px;
        height: 350px;
        background: radial-gradient(circle, rgba(61, 90, 241, 0.1) 0%, transparent 70%);
        border-radius: 50%;
        bottom: -100px;
        left: -100px;
        pointer-events: none;
      "></div>
      
      <!-- Main content card -->
      <div style="
        max-width: 1200px;
        width: 100%;
        text-align: center;
        position: relative;
        z-index: 1;
      ">
        <!-- Icon with gradient background -->
        <div style="
          width: 120px;
          height: 120px;
          margin: 0 auto 40px;
          background: linear-gradient(135deg, var(--accent) 0%, #5b6ff5 100%);
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3.5rem;
          box-shadow: 0 20px 40px rgba(61, 90, 241, 0.3);
          transform: rotate(-5deg);
          animation: float 3s ease-in-out infinite;
        ">
          🔐
        </div>
        
        <!-- Gradient heading -->
        <h1 style="
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 24px;
          background: linear-gradient(135deg, var(--text-main) 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.03em;
          line-height: 1.1;
        ">
          Unlock Premium Content
        </h1>
        
        <p style="
          font-size: 1.4rem;
          color: var(--text-secondary);
          margin-bottom: 56px;
          line-height: 1.6;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        ">
          Join our community to access exclusive stories, insights, and content crafted just for you.
        </p>
        
        <!-- Action buttons with modern design -->
        <div style="
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 64px;
        ">
          <a href="login.html" style="
            padding: 20px 56px;
            background: linear-gradient(135deg, var(--accent) 0%, #5b6ff5 100%);
            color: white;
            border-radius: var(--radius-pill);
            font-weight: 600;
            font-size: 1.2rem;
            text-decoration: none;
            box-shadow: 0 8px 24px rgba(61, 90, 241, 0.35);
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
          " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 32px rgba(61, 90, 241, 0.45)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px rgba(61, 90, 241, 0.35)';">
            <span>✨</span> Sign In
          </a>
          
          <a href="signup.html" style="
            padding: 20px 56px;
            background: var(--surface);
            color: var(--text-main);
            border: 2px solid var(--border);
            border-radius: var(--radius-pill);
            font-weight: 600;
            font-size: 1.2rem;
            text-decoration: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
          " onmouseover="this.style.transform='translateY(-3px)'; this.style.borderColor='var(--accent)'; this.style.boxShadow='0 8px 20px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--border)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.05)';">
            <span>🚀</span> Create Account
          </a>
        </div>
        
        <!-- Feature highlights -->
        <div style="
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          max-width: 1000px;
          margin: 0 auto;
        ">
          <div style="
            padding: 32px;
            background: var(--surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 16px 32px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            <div style="font-size: 2.5rem; margin-bottom: 16px;">📚</div>
            <h4 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 8px;">Rich Content</h4>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">Curated stories & articles</p>
          </div>
          
          <div style="
            padding: 32px;
            background: var(--surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 16px 32px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            <div style="font-size: 2.5rem; margin-bottom: 16px;">⚡</div>
            <h4 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 8px;">Fast Access</h4>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">Instant content delivery</p>
          </div>
          
          <div style="
            padding: 32px;
            background: var(--surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 16px 32px rgba(0, 0, 0, 0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            <div style="font-size: 2.5rem; margin-bottom: 16px;">🔒</div>
            <h4 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 8px;">Secure</h4>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">Protected & encrypted</p>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes float {
          0%, 100% { transform: rotate(-5deg) translateY(0px); }
          50% { transform: rotate(-5deg) translateY(-10px); }
        }
      </style>
    </div>
  `;
}

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
