// models/rolePermissionModel.js
import { DataTypes } from "sequelize";

const createRolePermissionModel = (sequelize, { Role, Permission }) => {
  const RolePermission = sequelize.define("RolePermission", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    assignedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: "roleId",
    otherKey: "permissionId",
  });

  Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: "permissionId",
    otherKey: "roleId",
  });

  return RolePermission;
};

export default createRolePermissionModel;
