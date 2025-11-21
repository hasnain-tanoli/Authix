import { Post, User, Media } from "../db/connection.js";
import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const createPost = asyncHandler(async (req, res) => {
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

  let featuredImageId = null;

  if (req.file) {
    const media = await Media.create({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
      url: "", // Will be constructed dynamically or updated
      uploaderId: req.user.id,
    });
    // Update URL to point to the media endpoint
    media.url = `/media/${media.id}`;
    await media.save();
    featuredImageId = media.id;
  }

  const post = await Post.create({
    title,
    content,
    slug,
    status: status || "draft",
    featuredImageId,
    authorId: req.user.id,
    publishedAt: status === "published" ? new Date() : null,
  });

  const postResponse = post.toJSON();
  if (featuredImageId) {
    postResponse.featuredImage = `/media/${featuredImageId}`;
  }

  res.status(201).json(postResponse);
});

export const updatePost = asyncHandler(async (req, res) => {
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
    // Delete old media if exists? Or keep it?
    // For now, let's just create new media.
    if (post.featuredImageId) {
        const oldMedia = await Media.findByPk(post.featuredImageId);
        if (oldMedia) await oldMedia.destroy();
    }

    const media = await Media.create({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
      url: "",
      uploaderId: req.user.id,
    });
    media.url = `/media/${media.id}`;
    await media.save();
    post.featuredImageId = media.id;
  }

  if (status === "published" && !post.publishedAt) {
    post.publishedAt = new Date();
  }

  await post.save();

  const postResponse = post.toJSON();
  if (post.featuredImageId) {
    postResponse.featuredImage = `/media/${post.featuredImageId}`;
  }

  res.json({ message: "Post updated successfully", post: postResponse });
});

export const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.findAll({
    include: [
      {
        model: User,
        attributes: ["id", "name", "username"],
      },
      {
        model: Media,
        as: "featuredImage",
        attributes: ["id", "url"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const postsWithImages = posts.map((p) => {
    const post = p.toJSON();
    if (post.featuredImage) {
        post.featuredImage = post.featuredImage.url;
    }
    return post;
  });

  res.json(postsWithImages);
});

export const getPostBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const post = await Post.findOne({
    where: { slug },
    include: [
      {
        model: User,
        attributes: ["name", "username"],
      },
      {
        model: Media,
        as: "featuredImage",
        attributes: ["id", "url"],
      },
    ],
  });

  if (!post) return res.status(404).json({ error: "Post not found" });

  const postResponse = post.toJSON();
  if (postResponse.featuredImage) {
    postResponse.featuredImage = postResponse.featuredImage.url;
  }

  res.json(postResponse);
});

export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findByPk(id);

  if (!post) return res.status(404).json({ error: "Post not found" });

  if (post.featuredImageId) {
    const media = await Media.findByPk(post.featuredImageId);
    if (media) await media.destroy();
  }

  await post.destroy();

  res.json({ message: "Post deleted successfully" });
});
