import { User, Post, Role, Permission } from "../db/connection.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  // Execute all queries in parallel for better performance
  const [userCount, postCount, roleCount, permCount, recentPosts] = await Promise.all([
    User.count(),
    Post.count(),
    Role.count(),
    Permission.count(),
    Post.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      include: { model: User, attributes: ["name"] },
    })
  ]);

  res.json({
    counts: {
      users: userCount,
      posts: postCount,
      roles: roleCount,
      permissions: permCount,
    },
    recentActivity: recentPosts,
  });
});
