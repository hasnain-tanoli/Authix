import { Post, User } from "../db/connection.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const createPost = async (req, res) => {
  try {
    let { title, content, slug, status } = req.body;

    if (!slug || slug.trim() === "") {
      slug = generateSlug(title);
    } else {
      slug = generateSlug(slug);
    }

    let uniqueSlug = slug;
    let counter = 1;
    while (await Post.findOne({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    slug = uniqueSlug;

    let featuredImage = null;
    if (req.file) {
      featuredImage = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create({
      title,
      content,
      slug,
      status: status || "draft",
      featuredImage,
      authorId: req.user.id,
      publishedAt: status === "published" ? new Date() : null,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    if (req.file) {
      const filePath = path.join(__dirname, "../uploads", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
      });
    }
    res.status(500).json({ error: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, content, slug, status } = req.body;

    const post = await Post.findByPk(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (title) post.title = title;
    if (content) post.content = content;
    if (status) post.status = status;

    if (slug && slug !== post.slug) {
      let uniqueSlug = generateSlug(slug);
      let counter = 1;
      while (
        await Post.findOne({ where: { slug: uniqueSlug, id: { [Op.ne]: id } } })
      ) {
        uniqueSlug = `${generateSlug(slug)}-${counter}`;
        counter++;
      }
      post.slug = uniqueSlug;
    }

    if (req.file) {
      post.featuredImage = `/uploads/${req.file.filename}`;
    }

    if (status === "published" && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();
    res.json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error(error);
    if (req.file) {
      const filePath = path.join(__dirname, "../uploads", req.file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete uploaded file:", err);
      });
    }
    res.status(500).json({ error: "Failed to update post" });
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
