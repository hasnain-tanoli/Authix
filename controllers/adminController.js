import { Role, Permission, User } from "../db/connection.js";

export const createRole = async (req, res) => {
  try {
    const { name, description, level } = req.body;
    const role = await Role.create({ name, description, level });
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: "Failed to create role" });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ include: Permission });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

export const deleteRole = async (req, res) => {
  try {
    await Role.destroy({ where: { id: req.params.id } });
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
    const perms = await Permission.findAll();
    res.json(perms);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

export const deletePermission = async (req, res) => {
  try {
    await Permission.destroy({ where: { id: req.params.id } });
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
    await user.addRole(role);
    res.json({ message: "Assigned" });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "username", "createdAt"],
      include: { model: Role, attributes: ["name"] },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};
