import { DataTypes } from "sequelize";

const createPermissionModel = (sequelize) => {
  const Permission = sequelize.define("Permission", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    resource: {
      type: DataTypes.ENUM(
        "users",
        "posts",
        "roles",
        "permissions",
        "dashboard"
      ),
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM("create", "read", "update", "delete"),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  return Permission;
};

export default createPermissionModel;
