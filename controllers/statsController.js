import { User, Post, Role, Permission } from "../db/connection.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const userCount = await User.count();
  const postCount = await Post.count();
  const roleCount = await Role.count();
  const permCount = await Permission.count();

  const recentPosts = await Post.findAll({
    limit: 5,
    order: [["createdAt", "DESC"]],
    include: { model: User, attributes: ["name"] },
  });

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
