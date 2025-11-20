let currentUser = null;

window.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  currentUser = await fetchProfile();

  if (currentUser) {
    const roles = currentUser.Roles.map((r) => r.name);
    if (roles.includes("admin")) {
      document.getElementById("adminLinks").style.display = "block";
      loadDashboardStats();
      populateCreationForms();
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
  event.currentTarget.classList.add("active");

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
      <div class="stat-card">
          <div class="stat-number">${data.counts.users}</div>
          <div class="stat-label">Total Users</div>
      </div>
      <div class="stat-card">
          <div class="stat-number">${data.counts.posts}</div>
          <div class="stat-label">Published Posts</div>
      </div>
      <div class="stat-card">
          <div class="stat-number">${data.counts.roles}</div>
          <div class="stat-label">Active Roles</div>
      </div>
      <div class="stat-card">
          <div class="stat-number">${data.counts.permissions}</div>
          <div class="stat-label">Permissions</div>
      </div>
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
  document.getElementById("usersTable").innerHTML = users
    .map(
      (u) => `
    <tr>
      <td><strong>${u.name}</strong><br><small>@${u.username}</small> ${
        u.isSystem ? '<span class="badge badge-system">SYS</span>' : ""
      }</td>
      <td>${u.email}</td>
      <td>${u.Roles.map(
        (r) => `<span class="badge badge-role">${r.name}</span>`
      ).join(" ")}</td>
      <td>
        ${
          u.isSystem
            ? '<span class="btn btn-disabled">Protected</span>'
            : `
            <button onclick='openEditModal("users", ${JSON.stringify(
              u
            )})' class="btn btn-secondary">Edit</button>
            <button onclick="deleteResource('users', ${
              u.id
            })" class="btn btn-danger">Del</button>
        `
        }
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
  document.getElementById("rolesTable").innerHTML = roles
    .map(
      (r) => `
    <tr>
      <td>${r.id}</td>
      <td>${r.name} ${
        r.isSystem ? '<span class="badge badge-system">SYS</span>' : ""
      }</td>
      <td>
        ${
          r.Permissions
            ? r.Permissions.map(
                (p) => `<span class="badge badge-role">${p.name}</span>`
              ).join(" ")
            : "None"
        }
      </td>
      <td>
        ${
          r.isSystem
            ? '<span class="btn btn-disabled">Protected</span>'
            : `
            <button onclick='openEditModal("roles", ${JSON.stringify(
              r
            )})' class="btn btn-secondary">Edit</button>
            <button onclick="deleteResource('roles', ${
              r.id
            })" class="btn btn-danger">Del</button>
        `
        }
      </td>
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
  document.getElementById("permsTable").innerHTML = perms
    .map(
      (p) => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name} ${
        p.isSystem ? '<span class="badge badge-system">SYS</span>' : ""
      }</td>
      <td>${p.action}:${p.resource}</td>
      <td>
        ${
          p.isSystem
            ? '<span class="btn btn-disabled">Protected</span>'
            : `
            <button onclick='openEditModal("permissions", ${JSON.stringify(
              p
            )})' class="btn btn-secondary">Edit</button>
            <button onclick="deleteResource('permissions', ${
              p.id
            })" class="btn btn-danger">Del</button>
        `
        }
      </td>
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
        <div class="card">
            <div style="display:flex; justify-content:space-between;">
                <div><h3>${p.title}</h3><span class="badge badge-role">${
        p.status
      }</span></div>
                <button onclick='openEditModal("posts", ${JSON.stringify(
                  p
                )})' class="btn btn-primary">Edit</button>
            </div>
            <p style="color:#94a3b8; margin-top:10px;">${p.slug}</p>
        </div>
    `
    )
    .join("");
}

window.deleteResource = async (type, id) => {
  if (!confirm("Are you sure you want to delete this item?")) return;
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`/admin/${type}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (res.status === 403) {
    alert(`Error: ${data.error}`);
    return;
  }

  if (type === "users") loadUsers();
  if (type === "roles") loadRoles();
  if (type === "permissions") loadPermissions();
};

window.openEditModal = async (type, data) => {
  const modal = document.getElementById("editModal");
  const title = document.getElementById("modalTitle");
  const fields = document.getElementById("modalFields");
  const token = localStorage.getItem("accessToken");

  document.getElementById("editId").value = data.id;
  document.getElementById("editType").value = type;
  title.innerText = `Edit ${type.slice(0, -1)}`;
  fields.innerHTML = "";

  if (type === "users") {
    const res = await fetch("/admin/roles", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allRoles = await res.json();
    const userRoleIds = data.Roles ? data.Roles.map((r) => r.id) : [];

    let roleChecks = allRoles
      .map(
        (r) => `
        <label class="checkbox-item">
            <input type="checkbox" name="editRoles" value="${r.id}" ${
          userRoleIds.includes(r.id) ? "checked" : ""
        }> ${r.name}
        </label>
    `
      )
      .join("");

    fields.innerHTML = `
            <div class="form-row"><input id="editName" value="${data.name}" placeholder="Name"></div>
            <div class="form-row"><input id="editUsername" value="${data.username}" placeholder="Username"></div>
            <div class="form-row"><input id="editEmail" value="${data.email}" placeholder="Email"></div>
            <label class="field-label">Manage Roles</label>
            <div class="checkbox-group">${roleChecks}</div>
        `;
  } else if (type === "roles") {
    const res = await fetch("/admin/permissions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allPerms = await res.json();
    const rolePermIds = data.Permissions
      ? data.Permissions.map((p) => p.id)
      : [];

    let permChecks = allPerms
      .map(
        (p) => `
        <label class="checkbox-item">
            <input type="checkbox" name="editPerms" value="${p.id}" ${
          rolePermIds.includes(p.id) ? "checked" : ""
        }> ${p.name}
        </label>
    `
      )
      .join("");

    fields.innerHTML = `
            <div class="form-row"><input id="editName" value="${data.name}" placeholder="Name"></div>
            <label class="field-label">Manage Permissions</label>
            <div class="checkbox-group">${permChecks}</div>
        `;
  } else if (type === "permissions") {
    fields.innerHTML = `
            <div class="form-row"><input id="editName" value="${data.name}" placeholder="Name"></div>
            <div class="form-row"><input id="editAction" value="${data.action}" placeholder="Action"></div>
            <div class="form-row"><input id="editResource" value="${data.resource}" placeholder="Resource"></div>
        `;
  } else if (type === "posts") {
    fields.innerHTML = `
            <div class="form-row"><input id="editTitle" value="${data.title}" placeholder="Title"></div>
            <div class="form-row"><textarea id="editContent" rows="5">${data.content}</textarea></div>
        `;
  }

  modal.classList.add("open");
};

window.closeModal = () => {
  document.getElementById("editModal").classList.remove("open");
};

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const type = document.getElementById("editType").value;
  const id = document.getElementById("editId").value;
  const token = localStorage.getItem("accessToken");

  const body = {};

  if (type === "users") {
    body.name = document.getElementById("editName").value;
    body.username = document.getElementById("editUsername").value;
    body.email = document.getElementById("editEmail").value;
    body.roleIds = Array.from(
      document.querySelectorAll('input[name="editRoles"]:checked')
    ).map((cb) => cb.value);
  } else if (type === "roles") {
    body.name = document.getElementById("editName").value;
    body.permissionIds = Array.from(
      document.querySelectorAll('input[name="editPerms"]:checked')
    ).map((cb) => cb.value);
  } else if (type === "permissions") {
    body.name = document.getElementById("editName").value;
    body.action = document.getElementById("editAction").value;
    body.resource = document.getElementById("editResource").value;
  } else if (type === "posts") {
    body.title = document.getElementById("editTitle").value;
    body.content = document.getElementById("editContent").value;
  }

  try {
    const res = await fetch(
      type === "posts" ? `/posts/${id}` : `/admin/${type}/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (res.ok) {
      closeModal();
      if (type === "users") loadUsers();
      if (type === "roles") loadRoles();
      if (type === "permissions") loadPermissions();
      if (type === "posts") loadPosts();
    } else {
      alert("Update Failed");
    }
  } catch (err) {
    console.error(err);
  }
});

async function populateCreationForms() {
  const token = localStorage.getItem("accessToken");

  const roleRes = await fetch("/admin/roles", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const roles = await roleRes.json();
  const userRoleContainer = document.getElementById("newUserRoleChecks");
  userRoleContainer.innerHTML = roles
    .map(
      (r) =>
        `<label class="checkbox-item"><input type="checkbox" name="newRoles" value="${r.id}"> ${r.name}</label>`
    )
    .join("");

  const permRes = await fetch("/admin/permissions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const perms = await permRes.json();
  const rolePermContainer = document.getElementById("newRolePermChecks");
  rolePermContainer.innerHTML = perms
    .map(
      (p) =>
        `<label class="checkbox-item"><input type="checkbox" name="newPerms" value="${p.id}"> ${p.name}</label>`
    )
    .join("");
}

document
  .getElementById("createUserForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = {
      name: document.getElementById("newUserName").value,
      username: document.getElementById("newUserUsername").value,
      email: document.getElementById("newUserEmail").value,
      password: document.getElementById("newUserPassword").value,
      roleIds: Array.from(
        document.querySelectorAll('input[name="newRoles"]:checked')
      ).map((cb) => cb.value),
    };

    try {
      const res = await fetch("/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        loadUsers();
        e.target.reset();
      } else {
        alert("Failed to create user");
      }
    } catch (err) {
      console.error(err);
    }
  });

document
  .getElementById("createRoleForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("newRoleName").value;
    const permissionIds = Array.from(
      document.querySelectorAll('input[name="newPerms"]:checked')
    ).map((cb) => cb.value);

    await fetch("/admin/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ name, permissionIds }),
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
  .getElementById("createPostForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("postTitle").value;
    const slug = document.getElementById("postSlug").value;
    const content = document.getElementById("postContent").value;

    try {
      const res = await fetch("/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          title,
          slug,
          content,
          status: "published",
        }),
      });

      if (res.ok) {
        loadPosts();
        e.target.reset();
      } else {
        alert("Failed to create post");
      }
    } catch (err) {
      console.error(err);
    }
  });
