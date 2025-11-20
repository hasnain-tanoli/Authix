import { Role, Permission, User } from "../db/connection.js";
import bcrypt from "bcrypt";

export const createUser = async (req, res) => {
  try {
    const { name, username, email, password, roleIds } = req.body;

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

    res.status(201).json({ message: "User created", user });
  } catch (error) {
    console.error(error);
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
    res.status(500).json({ error: "Fetch failed" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, username, roleIds } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isSystem)
      return res.status(403).json({ error: "Cannot edit System User" });

    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;

    await user.save();

    if (roleIds && Array.isArray(roleIds)) {
      await user.setRoles(roleIds);
    }

    res.json({ message: "User updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isSystem)
      return res.status(403).json({ error: "System users cannot be deleted." });

    await user.destroy();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;
    const role = await Role.create({ name, description });

    if (permissionIds && Array.isArray(permissionIds)) {
      await role.setPermissions(permissionIds);
    }

    res.status(201).json(role);
  } catch (error) {
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
    res.status(500).json({ error: "Fetch failed" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;
    const role = await Role.findByPk(req.params.id);

    if (!role) return res.status(404).json({ error: "Role not found" });
    if (role.isSystem)
      return res.status(403).json({ error: "Cannot edit System Role" });

    role.name = name || role.name;
    role.description = description || role.description;

    await role.save();

    if (permissionIds && Array.isArray(permissionIds)) {
      await role.setPermissions(permissionIds);
    }

    res.json({ message: "Role updated" });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) return res.status(404).json({ error: "Role not found" });

    if (role.isSystem) {
      return res.status(403).json({ error: "System roles cannot be deleted." });
    }

    await role.destroy();
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};

export const createPermission = async (req, res) => {
  try {
    const { name, resource, action, description } = req.body;
    const perm = await Permission.create({
      name,
      resource,
      action,
      description,
    });
    res.status(201).json(perm);
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
};

export const getAllPermissions = async (req, res) => {
  try {
    const perms = await Permission.findAll({ order: [["id", "ASC"]] });
    res.json(perms);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
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
    res.json({ message: "Permission updated" });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};

export const deletePermission = async (req, res) => {
  try {
    const perm = await Permission.findByPk(req.params.id);

    if (!perm) return res.status(404).json({ error: "Permission not found" });

    if (perm.isSystem) {
      return res
        .status(403)
        .json({ error: "System permissions cannot be deleted." });
    }

    await perm.destroy();
    res.json({ message: "Deleted" });
  } catch (error) {
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
    res.json({ message: "Assigned" });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
};

export const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    const user = await User.findByPk(userId);
    const role = await Role.findByPk(roleId);

    if (!user || !role) return res.status(404).json({ error: "Not found" });

    await user.addRole(role);
    res.json({ message: "Assigned" });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
};
