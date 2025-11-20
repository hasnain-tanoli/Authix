import { Post, PostHistory, Media } from "../db/connection.js";

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const media = await Media.create({
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploaderId: req.user.id,
    });

    res.status(201).json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
};

export const updatePost = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};
