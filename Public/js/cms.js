const POSTS_API_URL = "";

async function fetchPosts() {
  try {
    const res = await fetch(`${POSTS_API_URL}/posts`);
    const posts = await res.json();
    renderPosts(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
  }
}

async function createPost(title, slug, content) {
  const token = localStorage.getItem("accessToken");
  try {
    const res = await fetch(`${POSTS_API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, slug, content, status: "published" }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Post created successfully", "success");
      fetchPosts();
      document.getElementById("createPostForm").reset();
    } else {
      showToast(data.error || "Failed to create post", "error");
    }
  } catch (err) {
    showToast("Server Error", "error");
  }
}

async function deletePost(id) {
  const token = localStorage.getItem("accessToken");
  if (!confirm("Are you sure you want to delete this post?")) return;

  try {
    const res = await fetch(`${POSTS_API_URL}/posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      showToast("Post deleted", "success");
      fetchPosts();
    } else {
      showToast("Unauthorized or Failed", "error");
    }
  } catch (err) {
    showToast("Server Error", "error");
  }
}

function renderPosts(posts) {
  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = "<p style='color: #94a3b8'>No posts found.</p>";
    return;
  }

  const isAdmin = window.currentUser?.Roles.some((r) => r.name === "admin");

  posts.forEach((post) => {
    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
            <div class="post-header">
                <h3>${post.title}</h3>
                <span class="post-author">by ${
                  post.User?.name || "Unknown"
                }</span>
            </div>
            <p class="post-excerpt">${post.content.substring(0, 100)}...</p>
            <div class="post-actions">
                <a href="#" class="read-more">Read More</a>
                ${
                  isAdmin
                    ? `<button onclick="deletePost(${post.id})" class="btn-delete">Delete</button>`
                    : ""
                }
            </div>
        `;
    container.appendChild(card);
  });
}
