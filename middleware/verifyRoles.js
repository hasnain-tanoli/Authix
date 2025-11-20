import { User, Role } from "../db/connection.js";

export const verifyRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = await User.findByPk(req.user.id, {
        include: {
          model: Role,
          through: { attributes: [] },
        },
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const userRoles = user.Roles.map((role) => role.name);
      const hasRole = userRoles.some((role) => allowedRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};
