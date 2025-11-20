// models/userRoleModel.js
import { DataTypes } from "sequelize";

const createUserRoleModel = (sequelize, { User, Role }) => {
  const UserRole = sequelize.define("UserRole", {
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

  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: "userId",
    otherKey: "roleId",
  });

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: "roleId",
    otherKey: "userId",
  });

  return UserRole;
};

export default createUserRoleModel;
