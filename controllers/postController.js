import { Post, User } from "../db/connection.js";

export const createPost = async (req, res) => {
  try {
    const { title, content, slug, status } = req.body;

    const existingPost = await Post.findOne({ where: { slug } });
    if (existingPost) {
      return res.status(400).json({ error: "Slug must be unique" });
    }

    const post = await Post.create({
      title,
      content,
      slug,
      status: status || "draft",
      authorId: req.user.id,
      publishedAt: status === "published" ? new Date() : null,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ["id", "name", "username"],
      },
      order: [["createdAt", "DESC"]],
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({
      where: { slug },
      include: {
        model: User,
        attributes: ["name", "username"],
      },
    });

    if (!post) return res.status(404).json({ error: "Post not found" });

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Post.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ error: "Post not found" });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
};
