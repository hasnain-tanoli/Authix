import { Post, PostHistory, Media } from "../db/connection.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const media = await Media.create({
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploaderId: req.user.id,
  });

  res.status(201).json(media);
});

export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, status, metaTitle, metaDescription } = req.body;

  const post = await Post.findByPk(id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  await PostHistory.create({
    postId: post.id,
    contentSnapshot: JSON.stringify({
      title: post.title,
      content: post.content,
    }),
  });

  post.title = title || post.title;
  post.content = content || post.content;
  post.status = status || post.status;
  post.metaTitle = metaTitle || post.metaTitle;
  post.metaDescription = metaDescription || post.metaDescription;

  if (status === "published" && !post.publishedAt) {
    post.publishedAt = new Date();
  }

  await post.save();
  res.json(post);
});
