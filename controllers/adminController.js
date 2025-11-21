import { Role, Permission, User, sequelize } from "../db/connection.js";
import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createUser = asyncHandler(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, username, email, password, roleIds } = req.body;

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      await t.rollback();
      return res.status(400).json({ error: "Email already in use" });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      await t.rollback();
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create(
      {
        name,
        username,
        email,
        password: hashedPassword,
      },
      { transaction: t }
    );

    if (roleIds && Array.isArray(roleIds)) {
      await user.setRoles(roleIds, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: ["id", "name", "email", "username", "isSystem"],
    include: { model: Role, attributes: ["id", "name"] },
    order: [["id", "ASC"]],
  });
  res.json(users);
});

export const updateUser = asyncHandler(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, email, username, roleIds } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      await t.rollback();
      return res.status(404).json({ error: "User not found" });
    }
    if (user.isSystem) {
      await t.rollback();
      return res.status(403).json({ error: "Cannot edit System User" });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        await t.rollback();
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ where: { username } });
      if (usernameExists) {
        await t.rollback();
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;

    await user.save({ transaction: t });

    if (roleIds && Array.isArray(roleIds)) {
      await user.setRoles(roleIds, { transaction: t });
    }

    await t.commit();
    res.json({ message: "User updated successfully" });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.isSystem)
    return res.status(403).json({ error: "System users cannot be deleted" });

  await user.destroy();
  res.json({ message: "User deleted successfully" });
});

export const createRole = asyncHandler(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, permissionIds } = req.body;

    const existing = await Role.findOne({ where: { name } });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: "Role already exists" });
    }

    const role = await Role.create({ name, description }, { transaction: t });

    // Get posts.read permission
    const postsReadPerm = await Permission.findOne({ where: { name: "posts.read" } });
    
    // Prepare permission IDs array
    let finalPermissionIds = [];
    
    // Add user-selected permissions
    if (permissionIds && Array.isArray(permissionIds)) {
      finalPermissionIds = [...permissionIds];
    }
    
    // Auto-add posts.read if it exists and not already included
    if (postsReadPerm && !finalPermissionIds.includes(postsReadPerm.id.toString()) && !finalPermissionIds.includes(postsReadPerm.id)) {
      finalPermissionIds.push(postsReadPerm.id);
    }
    
    // Assign all permissions
    if (finalPermissionIds.length > 0) {
      await role.setPermissions(finalPermissionIds, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: "Role created with default posts.read permission", role });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.findAll({
    include: {
      model: Permission,
      attributes: ["id", "name", "action", "resource"],
    },
    order: [["id", "ASC"]],
  });
  res.json(roles);
});

export const updateRole = asyncHandler(async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, permissionIds } = req.body;
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      await t.rollback();
      return res.status(404).json({ error: "Role not found" });
    }
    if (role.isSystem) {
      await t.rollback();
      return res.status(403).json({ error: "Cannot edit System Role" });
    }

    if (name && name !== role.name) {
      const exists = await Role.findOne({ where: { name } });
      if (exists) {
        await t.rollback();
        return res.status(400).json({ error: "Role name already exists" });
      }
    }

    role.name = name || role.name;
    role.description = description || role.description;

    await role.save({ transaction: t });

    if (permissionIds && Array.isArray(permissionIds)) {
      await role.setPermissions(permissionIds, { transaction: t });
    }

    await t.commit();
    res.json({ message: "Role updated successfully" });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

export const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) return res.status(404).json({ error: "Role not found" });
  if (role.isSystem)
    return res.status(403).json({ error: "System roles cannot be deleted" });

  await role.destroy();
  res.json({ message: "Role deleted successfully" });
});

export const createPermission = asyncHandler(async (req, res) => {
  const { name, resource, action, description } = req.body;

  const existing = await Permission.findOne({ where: { name } });
  if (existing)
    return res.status(400).json({ error: "Permission name exists" });

  const perm = await Permission.create({
    name,
    resource,
    action,
    description,
  });

  // Auto-assign to admin role
  const adminRole = await Role.findOne({ where: { name: "admin" } });
  if (adminRole) {
    await adminRole.addPermission(perm);
  }

  // Auto-assign posts.read to user role
  if (name === "posts.read") {
    const userRole = await Role.findOne({ where: { name: "user" } });
    if (userRole) {
      await userRole.addPermission(perm);
    }
  }

  res.status(201).json({
    message: "Permission created and auto-assigned to appropriate roles",
    perm,
  });
});

export const getAllPermissions = asyncHandler(async (req, res) => {
  const perms = await Permission.findAll({
    order: [
      ["resource", "ASC"],
      ["id", "ASC"],
    ],
  });
  res.json(perms);
});

export const updatePermission = asyncHandler(async (req, res) => {
  const { name, resource, action } = req.body;
  const perm = await Permission.findByPk(req.params.id);

  if (!perm) return res.status(404).json({ error: "Permission not found" });
  if (perm.isSystem)
    return res.status(403).json({ error: "Cannot edit System Permission" });

  perm.name = name || perm.name;
  perm.resource = resource || perm.resource;
  perm.action = action || perm.action;

  await perm.save();
  res.json({ message: "Permission updated successfully" });
});

export const deletePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const perm = await Permission.findByPk(id, {
    include: [{ model: Role }],
  });

  if (!perm) return res.status(404).json({ error: "Permission not found" });
  if (perm.isSystem)
    return res
      .status(403)
      .json({ error: "System permissions cannot be deleted" });

  // Remove permission from all roles before deletion
  if (perm.Roles && perm.Roles.length > 0) {
    for (const role of perm.Roles) {
      await role.removePermission(perm);
    }
  }

  await perm.destroy();
  res.json({
    message: "Permission deleted successfully and removed from all roles",
  });
});

export const assignPermissionToRole = asyncHandler(async (req, res) => {
  const { roleId, permissionId } = req.body;
  const role = await Role.findByPk(roleId);
  const permission = await Permission.findByPk(permissionId);

  if (!role || !permission) return res.status(404).json({ error: "Not found" });

  await role.addPermission(permission);
  res.json({ message: "Assigned successfully" });
});

export const assignRoleToUser = asyncHandler(async (req, res) => {
  const { userId, roleId } = req.body;
  const user = await User.findByPk(userId);
  const role = await Role.findByPk(roleId);

  if (!user || !role) return res.status(404).json({ error: "Not found" });

  await user.addRole(role);
  res.json({ message: "Assigned successfully" });
});
