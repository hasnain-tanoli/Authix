// --- GLOBAL STATE & HELPERS ---
let currentUser = null;
window.state = { users: [], roles: [], permissions: [], posts: [] };
let modalContext = { type: null, mode: null, id: null };

// Helper: Check Permission
function hasPermission(permissionName) {
  if (!currentUser || !currentUser.Roles) return false;
  return currentUser.Roles.some(role => 
    role.Permissions && role.Permissions.some(perm => perm.name === permissionName)
  );
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await requireAuth();
    currentUser = await fetchProfile();
    
    if (!currentUser) {
      window.location.href = "login.html";
      return;
    }

    // Check if user has dashboard.read permission
    if (!hasPermission("dashboard.read")) {
      window.location.href = "unauthorized.html";
      return;
    }

    setupNavigation();
    loadDashboardStats();
    loadProfile(); 
    
    // Logout handler
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });

  } catch (e) {
    console.error("Init failed", e);
    window.location.href = "login.html";
  }
});

// --- NAVIGATION ---
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item[id^='nav-']");
  
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      const view = item.id.replace("nav-", "");
      handleViewSwitch(view);
    });
  });

  if (!hasPermission("users.read")) document.getElementById("nav-users").style.display = "none";
  if (!hasPermission("roles.read")) document.getElementById("nav-roles").style.display = "none";
  if (!hasPermission("permissions.read")) document.getElementById("nav-permissions").style.display = "none";
}

function handleViewSwitch(view) {
  const container = document.getElementById("dynamicContent");
  const title = document.getElementById("managementTitle");
  const createBtn = document.getElementById("createBtn");
  
  container.innerHTML = '<div style="text-align:center; padding:40px;">Loading...</div>';
  createBtn.style.display = "none";
  
  switch(view) {
    case "dashboard":
      title.innerText = "Recent System Activity";
      loadProfile(); 
      break;
    case "users":
      title.innerText = "User Management";
      if (hasPermission("users.create")) {
        createBtn.style.display = "block";
        createBtn.onclick = () => openCreateModal("users");
      }
      loadUsers();
      break;
    case "roles":
      title.innerText = "Role Management";
      if (hasPermission("roles.create")) {
        createBtn.style.display = "block";
        createBtn.onclick = () => openCreateModal("roles");
      }
      loadRoles();
      break;
    case "permissions":
      title.innerText = "Permission Management";
      if (hasPermission("permissions.create")) {
        createBtn.style.display = "block";
        createBtn.onclick = () => openCreateModal("permissions");
      }
      loadPermissions();
      break;
    case "posts":
      title.innerText = "Post Management";
      if (hasPermission("posts.create")) {
        createBtn.style.display = "block";
        createBtn.onclick = () => openCreateModal("posts");
      }
      loadPosts();
      break;
  }
}

// --- DATA LOADING ---
async function loadDashboardStats() {
  try {
    const data = await apiFetch("/admin/stats");
    updateStatRing("stat-users-ring", data.counts.users, 100); 
    updateStatRing("stat-posts-ring", data.counts.posts, 50);
    updateStatRing("stat-roles-ring", data.counts.roles, 10);
    updateStatRing("stat-perms-ring", data.counts.permissions, 20);
    window.state.recentActivity = data.recentActivity;
    if (document.getElementById("nav-dashboard").classList.contains("active")) {
        renderRecentActivity();
    }
  } catch (e) {
    console.error("Stats load error", e);
  }
}

function updateStatRing(id, value, max) {
  const el = document.getElementById(id);
  if (!el) return;
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  el.style.setProperty("--percent", `${percent}%`);
  el.setAttribute("data-value", value);
}

async function loadUsers() {
  try {
    const users = await apiFetch("/admin/users");
    window.state.users = users;
    const container = document.getElementById("dynamicContent");
    if (users.length === 0) {
      container.innerHTML = '<p class="text-secondary">No users found.</p>';
      return;
    }
    container.innerHTML = `
      <div class="table-container">
        <table class="table-ceramic">
          <thead><tr><th>User</th><th>Email</th><th>Roles</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><div style="font-weight:600;">${u.name}</div><div style="font-size:0.85rem; color:var(--text-tertiary);">@${u.username}</div></td>
                <td>${u.email}</td>
                <td><div style="display:flex; gap:4px; flex-wrap:wrap;">${u.Roles.map(r => `<span class="badge badge-role">${r.name}</span>`).join("")}</div></td>
                <td><div class="action-btn-group">
                    ${!u.isSystem && hasPermission("users.update") ? `<button class="btn-outline btn-sm" onclick="openEditModal('users', ${u.id})">Edit</button>` : ''}
                    ${!u.isSystem && hasPermission("users.delete") ? `<button class="btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="deleteResource('users', ${u.id})">Delete</button>` : ''}
                    ${u.isSystem ? '<span class="badge badge-system">System</span>' : ''}
                </div></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    showToast("Error", e.message, "error");
  }
}

async function loadRoles() {
  try {
    const roles = await apiFetch("/admin/roles");
    window.state.roles = roles;
    const container = document.getElementById("dynamicContent");
    container.innerHTML = `
      <div class="table-container">
        <table class="table-ceramic">
          <thead><tr><th>Role Name</th><th>Permissions</th><th>Actions</th></tr></thead>
          <tbody>
            ${roles.map(r => `
              <tr>
                <td><span style="font-weight:600;">${r.name}</span> ${r.isSystem ? '<span class="badge badge-system" style="margin-left:8px;">SYS</span>' : ''}</td>
                <td><div style="display:flex; gap:4px; flex-wrap:wrap; max-width:400px;">${r.Permissions ? r.Permissions.map(p => `<span class="badge badge-role">${p.name}</span>`).join("") : '<span class="text-tertiary">No permissions</span>'}</div></td>
                <td><div class="action-btn-group">
                    ${!r.isSystem && hasPermission("roles.update") ? `<button class="btn-outline btn-sm" onclick="openEditModal('roles', ${r.id})">Edit</button>` : ''}
                    ${!r.isSystem && hasPermission("roles.delete") ? `<button class="btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="deleteResource('roles', ${r.id})">Delete</button>` : ''}
                </div></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    showToast("Error", e.message, "error");
  }
}

async function loadPermissions() {
  try {
    const perms = await apiFetch("/admin/permissions");
    window.state.permissions = perms;
    const container = document.getElementById("dynamicContent");
    container.innerHTML = `
      <div class="table-container">
        <table class="table-ceramic">
          <thead><tr><th>Permission</th><th>Resource:Action</th><th>Actions</th></tr></thead>
          <tbody>
            ${perms.map(p => `
              <tr>
                <td><span style="font-weight:600;">${p.name}</span> ${p.isSystem ? '<span class="badge badge-system" style="margin-left:8px;">SYS</span>' : ''}</td>
                <td><code style="background:var(--bg-main); padding:2px 6px; border-radius:4px;">${p.action}:${p.resource}</code></td>
                <td><div class="action-btn-group">
                    ${!p.isSystem && hasPermission("permissions.update") ? `<button class="btn-outline btn-sm" onclick="openEditModal('permissions', ${p.id})">Edit</button>` : ''}
                    ${!p.isSystem && hasPermission("permissions.delete") ? `<button class="btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="deleteResource('permissions', ${p.id})">Delete</button>` : ''}
                </div></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    showToast("Error", e.message, "error");
  }
}

async function loadPosts() {
  try {
    const posts = await apiFetch("/posts");
    window.state.posts = posts;
    const container = document.getElementById("dynamicContent");
    if (posts.length === 0) {
        container.innerHTML = '<p>No posts found.</p>';
        return;
    }
    container.innerHTML = `
      <div class="table-container">
        <table class="table-ceramic">
          <thead><tr><th style="width: 60px;">Image</th><th>Title</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${posts.map(p => `
              <tr>
                <td>${p.featuredImage ? `<img src="${p.featuredImage}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">` : '<div style="width:40px; height:40px; background:var(--border); border-radius:6px;"></div>'}</td>
                <td><div style="font-weight:600;">${p.title}</div><div style="font-size:0.8rem; color:var(--text-tertiary);">/${p.slug}</div></td>
                <td><span class="badge badge-role">${p.status}</span></td>
                <td>${new Date(p.createdAt).toLocaleDateString()}</td>
                <td><div class="action-btn-group">
                    <a href="post.html?slug=${p.slug}" target="_blank" class="btn-outline btn-sm">View</a>
                    ${hasPermission("posts.update") ? `<button class="btn-outline btn-sm" onclick="openEditModal('posts', ${p.id})">Edit</button>` : ''}
                    ${hasPermission("posts.delete") ? `<button class="btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="deleteResource('posts', ${p.id})">Delete</button>` : ''}
                </div></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (e) {
    showToast("Error", "Failed to load posts", "error");
  }
}

async function loadProfile() {
    try {
        const user = await fetchProfile();
        if (!user) return;
        
        currentUser = user;
        
        document.getElementById("profileName").innerText = user.name;
        document.getElementById("profileEmail").innerText = user.email;
        
        const rolesContainer = document.getElementById("profileRoles");
        if (user.Roles && user.Roles.length > 0) {
            rolesContainer.innerHTML = user.Roles.map(r => `<span class="badge badge-role">${r.name}</span>`).join("");
        } else {
            rolesContainer.innerHTML = '<span class="text-tertiary">No roles assigned</span>';
        }
        
        const permsContainer = document.getElementById("profilePermissions");
        if (user.Roles && user.Roles.length > 0) {
            const allPerms = user.Roles.flatMap(r => r.Permissions || []);
            
            // Use name as the unique key since permissions don't have id in the response
            const uniquePerms = [...new Map(allPerms.map(p => [p.name, p])).values()];
            
            if (uniquePerms.length > 0) {
                permsContainer.innerHTML = uniquePerms.map(p => `<span class="badge badge-role" style="font-size:0.7rem;">${p.name}</span>`).join("");
            } else {
                permsContainer.innerHTML = '<span class="text-tertiary">No permissions</span>';
            }
        } else {
            permsContainer.innerHTML = '<span class="text-tertiary">No permissions</span>';
        }
        
        renderRecentActivity();
    } catch (e) {
        console.error("Failed to load profile", e);
    }
}

function renderRecentActivity() {
    const container = document.getElementById("dynamicContent");
    const activity = window.state.recentActivity || [];
    if (!document.getElementById("nav-dashboard").classList.contains("active")) return;
    
    if (activity.length === 0) {
        container.innerHTML = `<div style="background:var(--bg-main); padding:20px; border-radius:var(--radius-md); text-align:center; color:var(--text-secondary);">No recent activity found.</div>`;
        return;
    }
    container.innerHTML = `
        <div class="table-container">
            <table class="table-ceramic">
                <thead><tr><th>Action</th><th>User</th><th>Date</th></tr></thead>
                <tbody>
                    ${activity.map(post => `
                        <tr>
                            <td><span style="font-weight:600;">New Post Published</span><div style="font-size:0.85rem; color:var(--text-secondary);">${post.title}</div></td>
                            <td>${post.User?.name || 'Unknown'}</td>
                            <td>${new Date(post.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

// --- MODAL FUNCTIONS ---
window.openCreateModal = async (type) => {
    modalContext = { type, mode: 'create', id: null };
    document.getElementById("modalTitle").innerText = `Create ${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)}`;
    await renderModalForm(type, null);
    document.getElementById("crudModal").classList.add("show");
};

window.openEditModal = async (type, id) => {
    modalContext = { type, mode: 'edit', id };
    document.getElementById("modalTitle").innerText = `Edit ${type.slice(0, -1).charAt(0).toUpperCase() + type.slice(1, -1)}`;
    const item = window.state[type].find(i => i.id === id);
    await renderModalForm(type, item);
    document.getElementById("crudModal").classList.add("show");
};

window.closeModal = () => {
    document.getElementById("crudModal").classList.remove("show");
    modalContext = { type: null, mode: null, id: null };
};

async function renderModalForm(type, data) {
    const fieldsContainer = document.getElementById("modalFields");
    let html = '';
    
    switch(type) {
        case 'users':
            const allRoles = await apiFetch("/admin/roles");
            html = `
                <div class="modal-field"><label>Name</label><input type="text" id="field_name" class="input-ceramic" value="${data?.name || ''}" required></div>
                <div class="modal-field"><label>Username</label><input type="text" id="field_username" class="input-ceramic" value="${data?.username || ''}" required></div>
                <div class="modal-field"><label>Email</label><input type="email" id="field_email" class="input-ceramic" value="${data?.email || ''}" required></div>
                ${!data ? '<div class="modal-field"><label>Password</label><input type="password" id="field_password" class="input-ceramic" required></div>' : ''}
                <div class="modal-field"><label>Roles</label><div class="checkbox-group">
                    ${allRoles.map(r => `<div class="checkbox-item"><input type="checkbox" id="role_${r.id}" value="${r.id}" ${data?.Roles?.some(ur => ur.id === r.id) ? 'checked' : ''}><label for="role_${r.id}">${r.name}</label></div>`).join("")}
                </div></div>
            `;
            break;
        case 'roles':
            const allPerms = await apiFetch("/admin/permissions");
            html = `
                <div class="modal-field"><label>Role Name</label><input type="text" id="field_name" class="input-ceramic" value="${data?.name || ''}" required></div>
                <div class="modal-field"><label>Permissions</label><div class="checkbox-group">
                    ${allPerms.map(p => `<div class="checkbox-item"><input type="checkbox" id="perm_${p.id}" value="${p.id}" ${data?.Permissions?.some(rp => rp.id === p.id) ? 'checked' : ''}><label for="perm_${p.id}">${p.name}</label></div>`).join("")}
                </div></div>
            `;
            break;
        case 'permissions':
            html = `
                <div class="modal-field"><label>Permission Name</label><input type="text" id="field_name" class="input-ceramic" value="${data?.name || ''}" required></div>
                <div class="modal-field"><label>Resource</label><select id="field_resource" class="input-ceramic" required>
                    <option value="">Select Resource</option>
                    <option value="users" ${data?.resource === 'users' ? 'selected' : ''}>Users</option>
                    <option value="roles" ${data?.resource === 'roles' ? 'selected' : ''}>Roles</option>
                    <option value="permissions" ${data?.resource === 'permissions' ? 'selected' : ''}>Permissions</option>
                    <option value="posts" ${data?.resource === 'posts' ? 'selected' : ''}>Posts</option>
                    <option value="dashboard" ${data?.resource === 'dashboard' ? 'selected' : ''}>Dashboard</option>
                </select></div>
                <div class="modal-field"><label>Action</label><select id="field_action" class="input-ceramic" required>
                    <option value="">Select Action</option>
                    <option value="create" ${data?.action === 'create' ? 'selected' : ''}>Create</option>
                    <option value="read" ${data?.action === 'read' ? 'selected' : ''}>Read</option>
                    <option value="update" ${data?.action === 'update' ? 'selected' : ''}>Update</option>
                    <option value="delete" ${data?.action === 'delete' ? 'selected' : ''}>Delete</option>
                </select></div>
            `;
            break;
        case 'posts':
            html = `
                <div class="modal-field"><label>Title</label><input type="text" id="field_title" class="input-ceramic" value="${data?.title || ''}" required></div>
                <div class="modal-field"><label>Content</label><textarea id="field_content" class="input-ceramic" required>${data?.content || ''}</textarea></div>
                <div class="modal-field"><label>Featured Image URL</label><input type="url" id="field_featuredImage" class="input-ceramic" value="${data?.featuredImage || ''}"></div>
                <div class="modal-field"><label>Status</label><select id="field_status" class="input-ceramic" required>
                    <option value="draft" ${data?.status === 'draft' ? 'selected' : ''}>Draft</option>
                    <option value="published" ${data?.status === 'published' ? 'selected' : ''}>Published</option>
                </select></div>
            `;
            break;
    }
    
    fieldsContainer.innerHTML = html;
    
    document.getElementById("modalForm").onsubmit = async (e) => {
        e.preventDefault();
        await handleModalSubmit();
    };
}

async function handleModalSubmit() {
    const { type, mode, id } = modalContext;
    let payload = {};
    
    switch(type) {
        case 'users':
            payload.name = document.getElementById("field_name").value;
            payload.username = document.getElementById("field_username").value;
            payload.email = document.getElementById("field_email").value;
            if (mode === 'create') payload.password = document.getElementById("field_password").value;
            payload.roleIds = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
            break;
        case 'roles':
            payload.name = document.getElementById("field_name").value;
            payload.permissionIds = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')).map(cb => parseInt(cb.value));
            break;
        case 'permissions':
            payload.name = document.getElementById("field_name").value;
            payload.resource = document.getElementById("field_resource").value;
            payload.action = document.getElementById("field_action").value;
            break;
        case 'posts':
            payload.title = document.getElementById("field_title").value;
            payload.content = document.getElementById("field_content").value;
            payload.featuredImage = document.getElementById("field_featuredImage").value || null;
            payload.status = document.getElementById("field_status").value;
            break;
    }
    
    try {
        let url = `/admin/${type}`;
        if (type === 'posts') url = '/posts';
        if (mode === 'edit') url += `/${id}`;
        
        await apiFetch(url, {
            method: mode === 'create' ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        showToast("Success", `${type.slice(0, -1)} ${mode === 'create' ? 'created' : 'updated'} successfully`, "success");
        closeModal();
        
        if (type === 'users') loadUsers();
        if (type === 'roles') loadRoles();
        if (type === 'permissions') loadPermissions();
        if (type === 'posts') loadPosts();
    } catch (e) {
        showToast("Error", e.message, "error");
    }
}

window.deleteResource = async (type, id) => {
    if(!confirm("Are you sure?")) return;
    try {
        let url = `/admin/${type}/${id}`;
        if (type === "posts") url = `/posts/${id}`;
        await apiFetch(url, { method: "DELETE" });
        showToast("Success", "Item deleted", "success");
        if (type === "users") loadUsers();
        if (type === "roles") loadRoles();
        if (type === "permissions") loadPermissions();
        if (type === "posts") loadPosts();
    } catch(e) {
        showToast("Error", e.message, "error");
    }
};
