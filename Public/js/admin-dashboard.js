let currentUser = null;

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

document.getElementById("postTitle").addEventListener("input", (e) => {
  const slugField = document.getElementById("postSlug");
  if (!slugField.getAttribute("data-manually-edited")) {
    slugField.value = generateSlug(e.target.value);
  }
});

document.getElementById("postSlug").addEventListener("input", (e) => {
  e.target.setAttribute("data-manually-edited", "true");
});

window.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  try {
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
  } catch (e) {
    showToast("Error", "Failed to load profile", "error");
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
  try {
    const data = await apiFetch("/admin/stats");

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
  try {
    const users = await apiFetch("/admin/users");
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
  } catch (e) {
    showToast("Error", e.message, "error");
  }
}

async function loadRoles() {
  try {
    const roles = await apiFetch("/admin/roles");
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
  } catch (e) {
    showToast("Error", e.message, "error");
  }
}

async function loadPermissions() {
  try {
    const perms = await apiFetch("/admin/permissions");
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
  } catch (e) {
    showToast("Error", e.message, "error");
  }
}

async function loadPosts() {
  try {
    const res = await fetch("/posts");
    const posts = await res.json();
    document.getElementById("postsList").innerHTML = posts
      .map(
        (p) => `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items: flex-start;">
                <div style="display:flex; gap:15px;">
                    ${
                      p.featuredImage
                        ? `<img src="${p.featuredImage}" style="width:80px; height:80px; object-fit:cover; border-radius:8px;">`
                        : ""
                    }
                    <div>
                        <h3>${p.title}</h3>
                        <div style="margin-top:5px;">
                            <span class="badge badge-role" style="background:rgba(255,255,255,0.1); color:#fff; border:none;">${
                              p.status
                            }</span>
                            <span style="color:#94a3b8; font-size:0.85rem; margin-left:10px;">/${
                              p.slug
                            }</span>
                        </div>
                    </div>
                </div>
                <button onclick='openEditModal("posts", ${JSON.stringify(
                  p
                )})' class="btn btn-primary">Edit</button>
            </div>
        </div>
    `
      )
      .join("");
  } catch (e) {
    showToast("Error", "Failed to load posts", "error");
  }
}

window.deleteResource = async (type, id) => {
  if (!confirm("Are you sure you want to delete this item?")) return;

  try {
    const data = await apiFetch(`/admin/${type}/${id}`, { method: "DELETE" });
    showToast("Deleted", data.message, "success");

    if (type === "users") loadUsers();
    if (type === "roles") loadRoles();
    if (type === "permissions") loadPermissions();
  } catch (e) {
    showToast("Error", e.message, "error");
  }
};

window.openEditModal = async (type, data) => {
  const modal = document.getElementById("editModal");
  const title = document.getElementById("modalTitle");
  const fields = document.getElementById("modalFields");

  document.getElementById("editId").value = data.id;
  document.getElementById("editType").value = type;
  title.innerText = `Edit ${type.slice(0, -1)}`;
  fields.innerHTML = '<div style="text-align:center">Loading...</div>';
  modal.classList.add("open");

  try {
    if (type === "users") {
      const allRoles = await apiFetch("/admin/roles");
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
      const allPerms = await apiFetch("/admin/permissions");
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
            <div class="form-row"><input id="editTitle" value="${
              data.title
            }" placeholder="Title"></div>
            <div class="form-row"><input id="editSlug" value="${
              data.slug
            }" placeholder="Slug"></div>
            <div class="form-row">
                <select id="editStatus">
                    <option value="draft" ${
                      data.status === "draft" ? "selected" : ""
                    }>Draft</option>
                    <option value="published" ${
                      data.status === "published" ? "selected" : ""
                    }>Published</option>
                    <option value="archived" ${
                      data.status === "archived" ? "selected" : ""
                    }>Archived</option>
                </select>
                <div style="flex:1;">
                   <label class="field-label">Update Image (Optional)</label>
                   <input type="file" id="editImage" accept="image/*">
                </div>
            </div>
            <div class="form-row"><textarea id="editContent" rows="5">${
              data.content
            }</textarea></div>
        `;
    }
  } catch (e) {
    showToast("Error", "Failed to load edit data", "error");
    closeModal();
  }
};

window.closeModal = () => {
  document.getElementById("editModal").classList.remove("open");
};

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const type = document.getElementById("editType").value;
  const id = document.getElementById("editId").value;
  const token = localStorage.getItem("accessToken");

  if (type === "posts") {
    const formData = new FormData();
    formData.append("title", document.getElementById("editTitle").value);
    formData.append("slug", document.getElementById("editSlug").value);
    formData.append("content", document.getElementById("editContent").value);
    formData.append("status", document.getElementById("editStatus").value);

    const imageInput = document.getElementById("editImage");
    if (imageInput.files.length > 0) {
      formData.append("image", imageInput.files[0]);
    }

    try {
      const res = await fetch(`/posts/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        showToast("Success", "Post updated", "success");
        closeModal();
        loadPosts();
      } else {
        showToast("Error", result.error || "Update failed", "error");
      }
    } catch (err) {
      showToast("Error", err.message, "error");
    }
    return;
  }

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
  }

  try {
    const res = await apiFetch(`/admin/${type}/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    showToast("Success", res.message || "Item updated", "success");
    closeModal();

    if (type === "users") loadUsers();
    if (type === "roles") loadRoles();
    if (type === "permissions") loadPermissions();
  } catch (err) {
    showToast("Error", err.message, "error");
  }
});

async function populateCreationForms() {
  try {
    const roles = await apiFetch("/admin/roles");
    const userRoleContainer = document.getElementById("newUserRoleChecks");
    userRoleContainer.innerHTML = roles
      .map(
        (r) =>
          `<label class="checkbox-item"><input type="checkbox" name="newRoles" value="${r.id}"> ${r.name}</label>`
      )
      .join("");

    const perms = await apiFetch("/admin/permissions");
    const rolePermContainer = document.getElementById("newRolePermChecks");
    rolePermContainer.innerHTML = perms
      .map(
        (p) =>
          `<label class="checkbox-item"><input type="checkbox" name="newPerms" value="${p.id}"> ${p.name}</label>`
      )
      .join("");
  } catch (e) {
    showToast("Error", "Failed to load form options", "error");
  }
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
      const res = await apiFetch("/admin/users", {
        method: "POST",
        body: JSON.stringify(body),
      });
      showToast("Success", res.message, "success");
      loadUsers();
      e.target.reset();
    } catch (err) {
      showToast("Error", err.message, "error");
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

    try {
      const res = await apiFetch("/admin/roles", {
        method: "POST",
        body: JSON.stringify({ name, permissionIds }),
      });
      showToast("Success", "Role created", "success");
      loadRoles();
      e.target.reset();
    } catch (e) {
      showToast("Error", e.message, "error");
    }
  });

document
  .getElementById("createPermForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("permName").value;
    const action = document.getElementById("permAction").value;
    const resource = document.getElementById("permResource").value;

    try {
      const res = await apiFetch("/admin/permissions", {
        method: "POST",
        body: JSON.stringify({ name, action, resource }),
      });
      showToast("Success", "Permission created", "success");
      loadPermissions();
      e.target.reset();
    } catch (e) {
      showToast("Error", e.message, "error");
    }
  });

document
  .getElementById("createPostForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", document.getElementById("postTitle").value);
    formData.append("slug", document.getElementById("postSlug").value);
    formData.append("content", document.getElementById("postContent").value);
    formData.append("status", document.getElementById("postStatus").value);

    const imageInput = document.getElementById("postImage");
    if (imageInput.files.length > 0) {
      formData.append("image", imageInput.files[0]);
    }

    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch("/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Success", "Post published", "success");
        loadPosts();
        e.target.reset();
        document
          .getElementById("postSlug")
          .removeAttribute("data-manually-edited");
      } else {
        showToast("Error", data.error || "Failed", "error");
      }
    } catch (err) {
      showToast("Error", err.message, "error");
    }
  });
