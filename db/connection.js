import { Sequelize } from "sequelize";
import createUserModel from "../models/userModel.js";
import createRoleModel from "../models/roleModel.js";
import createPostModel from "../models/postModel.js";
import createPermissionModel from "../models/permissionModel.js";
import createUserRoleModel from "../models/userRoleModel.js";
import createRolePermissionModel from "../models/rolePermissionModel.js";
import createMediaModel from "../models/mediaModel.js";
import createPostHistoryModel from "../models/postHistoryModel.js";

let User, Role, Post, Permission, UserRole, RolePermission, Media, PostHistory;

export const connectDB = async (database, username, password, host) => {
  if (User) return;

  const isLocal = host === "localhost" || host === "127.0.0.1";

  const sequelize = new Sequelize(database, username, password, {
    host: host || "localhost",
    dialect: "postgres",
    dialectOptions: {
      ssl: isLocal ? false : { require: true, rejectUnauthorized: false },
    },
    logging: false,
  });

  try {
    await sequelize.authenticate();

    User = createUserModel(sequelize);
    Role = createRoleModel(sequelize);
    Post = createPostModel(sequelize);
    Permission = createPermissionModel(sequelize);
    Media = createMediaModel(sequelize);
    PostHistory = createPostHistoryModel(sequelize);

    UserRole = createUserRoleModel(sequelize, { User, Role });
    RolePermission = createRolePermissionModel(sequelize, { Role, Permission });

    User.hasMany(Post, { foreignKey: "authorId" });
    Post.belongsTo(User, { foreignKey: "authorId" });

    User.hasMany(Media, { foreignKey: "uploaderId" });
    Media.belongsTo(User, { foreignKey: "uploaderId" });

    Post.hasMany(PostHistory, { foreignKey: "postId" });
    PostHistory.belongsTo(Post, { foreignKey: "postId" });

    await sequelize.sync({ alter: true });
    console.log("Database synced with new SEO, Media, and Versioning models.");
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
};

export {
  User,
  Role,
  Post,
  Permission,
  Media,
  PostHistory,
  UserRole,
  RolePermission,
};
