let currentUser = null;

window.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  currentUser = await fetchProfile();

  if (currentUser) {
    const roles = currentUser.Roles.map((r) => r.name);

    if (roles.includes("admin")) {
      document.getElementById("adminLinks").style.display = "block";
      loadDashboardStats();
    } else {
      switchView("posts");
    }

    loadPosts();
  }
});

window.switchView = function (viewName) {
  document
    .querySelectorAll(".menu-item")
    .forEach((el) => el.classList.remove("active"));
  event.target.classList.add("active");

  document
    .querySelectorAll(".view-section")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(`view-${viewName}`).classList.add("active");

  if (viewName === "users") loadUsers();
  if (viewName === "roles") loadRoles();
  if (viewName === "permissions") loadPermissions();
  if (viewName === "dashboard") loadDashboardStats();
};

async function loadDashboardStats() {
  const token = localStorage.getItem("accessToken");
  try {
    const res = await fetch("/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();

    const grid = document.getElementById("statsGrid");
    grid.innerHTML = `
      <div class="stat-card"><div class="stat-number">${data.counts.users}</div><div class="stat-label">Users</div></div>
      <div class="stat-card"><div class="stat-number">${data.counts.posts}</div><div class="stat-label">Posts</div></div>
      <div class="stat-card"><div class="stat-number">${data.counts.roles}</div><div class="stat-label">Roles</div></div>
      <div class="stat-card"><div class="stat-number">${data.counts.permissions}</div><div class="stat-label">Permissions</div></div>
    `;

    const tbody = document.getElementById("recentActivityTable");
    tbody.innerHTML = data.recentActivity
      .map(
        (post) => `
      <tr>
        <td>${post.title}</td>
        <td>${post.User?.name || "Unknown"}</td>
        <td>${new Date(post.createdAt).toLocaleDateString()}</td>
      </tr>
    `
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

async function loadUsers() {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const users = await res.json();

  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>${u.name} <br><small style="color:#64748b">${u.username}</small></td>
      <td>${u.email}</td>
      <td>${u.Roles.map(
        (r) => `<span class="role-badge">${r.name}</span>`
      ).join(" ")}</td>
      <td>
        <button onclick="deleteResource('users', ${
          u.id
        })" style="color: #ef4444; background: none; border: none; cursor: pointer;">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

async function loadRoles() {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("/admin/roles", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const roles = await res.json();

  const tbody = document.getElementById("rolesTable");
  tbody.innerHTML = roles
    .map(
      (r) => `
    <tr>
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td>${r.Permissions ? r.Permissions.length : 0} perms</td>
      <td><button onclick="deleteResource('roles', ${
        r.id
      })" style="color: #ef4444; background:none; border:none; cursor:pointer">Delete</button></td>
    </tr>
  `
    )
    .join("");
}

async function loadPermissions() {
  const token = localStorage.getItem("accessToken");
  const res = await fetch("/admin/permissions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const perms = await res.json();

  const tbody = document.getElementById("permsTable");
  tbody.innerHTML = perms
    .map(
      (p) => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.action}</td>
      <td>${p.resource}</td>
      <td><button onclick="deleteResource('permissions', ${p.id})" style="color: #ef4444; background:none; border:none; cursor:pointer">Delete</button></td>
    </tr>
  `
    )
    .join("");
}

async function loadPosts() {
  const res = await fetch("/posts");
  const posts = await res.json();
  document.getElementById("postsList").innerHTML = posts
    .map(
      (p) => `
        <div class="post-card" style="margin-bottom: 10px;">
            <h3>${p.title}</h3>
            <small>${p.status}</small>
        </div>
    `
    )
    .join("");
}

window.deleteResource = async (type, id) => {
  if (!confirm("Are you sure?")) return;
  const token = localStorage.getItem("accessToken");
  await fetch(`/admin/${type}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (type === "users") loadUsers();
  if (type === "roles") loadRoles();
  if (type === "permissions") loadPermissions();
};

document
  .getElementById("createRoleForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("newRoleName").value;
    const level = document.getElementById("newRoleLevel").value;

    await fetch("/admin/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ name, level }),
    });
    loadRoles();
    e.target.reset();
  });

document
  .getElementById("createPermForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("permName").value;
    const action = document.getElementById("permAction").value;
    const resource = document.getElementById("permResource").value;

    await fetch("/admin/permissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ name, action, resource }),
    });
    loadPermissions();
    e.target.reset();
  });

document
  .getElementById("assignRoleForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const userId = document.getElementById("assignUserId").value;
    const roleId = document.getElementById("assignRoleId").value;

    await fetch("/admin/assign-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ userId, roleId }),
    });
    alert("Role Assigned");
    loadUsers();
  });
