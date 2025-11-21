import { User, Role, Permission } from "../db/connection.js";

/**
 * Middleware to verify if user has specific permission
 * @param {string} permissionName - The permission name to check (e.g., "posts.create", "posts.update")
 */
export const verifyPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Fetch user with roles and permissions
      const user = await User.findByPk(userId, {
        include: {
          model: Role,
          include: {
            model: Permission,
            through: { attributes: [] },
          },
          through: { attributes: [] },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user has the required permission through any of their roles
      const hasPermission = user.Roles.some((role) =>
        role.Permissions.some((perm) => perm.name === permissionName)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: "Forbidden", 
          message: `You do not have the required permission: ${permissionName}` 
        });
      }

      next();
    } catch (error) {
      console.error("Permission verification error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};
