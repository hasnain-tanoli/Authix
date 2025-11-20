import { User, Post, Role, Permission } from "../db/connection.js";

export const getDashboardStats = async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load stats" });
  }
};
