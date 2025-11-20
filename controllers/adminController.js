import { Role, Permission, User } from "../db/connection.js";
import bcrypt from "bcrypt";

export const createUser = async (req, res) => {
  try {
    const { name, username, email, password, roleIds } = req.body;

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    if (roleIds && Array.isArray(roleIds)) {
      await user.setRoles(roleIds);
    }

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "username", "isSystem"],
      include: { model: Role, attributes: ["id", "name"] },
      order: [["id", "ASC"]],
    });
    res.json(users);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, username, roleIds } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isSystem)
      return res.status(403).json({ error: "Cannot edit System User" });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists)
        return res.status(400).json({ error: "Email already in use" });
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ where: { username } });
      if (usernameExists)
        return res.status(400).json({ error: "Username already taken" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;

    await user.save();

    if (roleIds && Array.isArray(roleIds)) {
      await user.setRoles(roleIds);
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ error: "Update failed" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isSystem)
      return res.status(403).json({ error: "System users cannot be deleted" });

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;

    const existing = await Role.findOne({ where: { name } });
    if (existing)
      return res.status(400).json({ error: "Role name already exists" });

    const role = await Role.create({ name, description });

    if (permissionIds && Array.isArray(permissionIds)) {
      await role.setPermissions(permissionIds);
    }

    res.status(201).json({ message: "Role created", role });
  } catch (error) {
    console.error("Error in createRole:", error);
    res.status(500).json({ error: "Failed to create role" });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      include: {
        model: Permission,
        attributes: ["id", "name", "action", "resource"],
      },
      order: [["id", "ASC"]],
    });
    res.json(roles);
  } catch (error) {
    console.error("Error in getAllRoles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;
    const role = await Role.findByPk(req.params.id);

    if (!role) return res.status(404).json({ error: "Role not found" });
    if (role.isSystem)
      return res.status(403).json({ error: "Cannot edit System Role" });

    if (name && name !== role.name) {
      const exists = await Role.findOne({ where: { name } });
      if (exists)
        return res.status(400).json({ error: "Role name already exists" });
    }

    role.name = name || role.name;
    role.description = description || role.description;

    await role.save();

    if (permissionIds && Array.isArray(permissionIds)) {
      await role.setPermissions(permissionIds);
    }

    res.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Error in updateRole:", error);
    res.status(500).json({ error: "Update failed" });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ error: "Role not found" });
    if (role.isSystem)
      return res.status(403).json({ error: "System roles cannot be deleted" });

    await role.destroy();
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error in deleteRole:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};

export const createPermission = async (req, res) => {
  try {
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
    res.status(201).json({ message: "Permission created", perm });
  } catch (error) {
    console.error("Error in createPermission:", error);
    res.status(500).json({ error: "Failed to create permission" });
  }
};

export const getAllPermissions = async (req, res) => {
  try {
    const perms = await Permission.findAll({
      order: [
        ["resource", "ASC"],
        ["id", "ASC"],
      ],
    });
    res.json(perms);
  } catch (error) {
    console.error("Error in getAllPermissions:", error);
    res.status(500).json({ error: "Failed to fetch permissions" });
  }
};

export const updatePermission = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error in updatePermission:", error);
    res.status(500).json({ error: "Update failed" });
  }
};

export const deletePermission = async (req, res) => {
  try {
    const perm = await Permission.findByPk(req.params.id);
    if (!perm) return res.status(404).json({ error: "Permission not found" });
    if (perm.isSystem)
      return res
        .status(403)
        .json({ error: "System permissions cannot be deleted" });

    await perm.destroy();
    res.json({ message: "Permission deleted successfully" });
  } catch (error) {
    console.error("Error in deletePermission:", error);
    res.status(500).json({ error: "Delete failed" });
  }
};

export const assignPermissionToRole = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;
    const role = await Role.findByPk(roleId);
    const permission = await Permission.findByPk(permissionId);

    if (!role || !permission)
      return res.status(404).json({ error: "Not found" });

    await role.addPermission(permission);
    res.json({ message: "Assigned successfully" });
  } catch (error) {
    console.error("Error in assignPermissionToRole:", error);
    res.status(500).json({ error: "Assignment failed" });
  }
};

export const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const user = await User.findByPk(userId);
    const role = await Role.findByPk(roleId);

    if (!user || !role) return res.status(404).json({ error: "Not found" });

    await user.addRole(role);
    res.json({ message: "Assigned successfully" });
  } catch (error) {
    console.error("Error in assignRoleToUser:", error);
    res.status(500).json({ error: "Assignment failed" });
  }
};
