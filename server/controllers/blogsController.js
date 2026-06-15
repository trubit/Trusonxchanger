import mongoose from "mongoose";
import Blog from "../models/Blog.js";

const parseLimit = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const parseSort = (value) => {
  if (!value) {
    return { updatedAt: -1 };
  }

  const isDesc = value.startsWith("-");
  const field = isDesc ? value.slice(1) : value;
  const allowed = new Set(["updatedAt", "createdAt", "title"]);

  if (!allowed.has(field)) {
    return { updatedAt: -1 };
  }

  return { [field]: isDesc ? -1 : 1 };
};

const slugify = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "post";

const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 0;

  while (counter < 50) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await Blog.exists(query);
    if (!exists) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter + 1}`;
  }

  return `${baseSlug}-${Date.now()}`;
};

const serializePost = (_req, postDoc) => {
  if (!postDoc) return postDoc;
  return postDoc.toJSON ? postDoc.toJSON() : postDoc;
};

const toPayload = (body) => ({
  title: body.title?.trim() ?? "",
  description: body.description?.trim() ?? "",
  link: body.link?.trim() ?? "",
  image: body.image?.trim() ?? "",
  imageAlt: body.imageAlt?.trim() ?? "",
  tag: body.tag?.trim() ?? "",
  date: body.date?.trim() ?? "",
});

const findBySlugOrId = async (key) => {
  if (mongoose.Types.ObjectId.isValid(key)) {
    const post = await Blog.findById(key);
    if (post) return post;
  }
  return Blog.findOne({ slug: key });
};

// GET /blogs: list recent blog posts.
export const listBlogs = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const sort = parseSort(req.query.sort);
    const query = Blog.find().sort(sort);
    if (limit) {
      query.limit(limit);
    }
    const posts = await query;
    const payload = posts.map((post) => serializePost(req, post));
    res.json({ posts: payload });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /blogs/:id: fetch a single post.
export const getBlog = async (req, res) => {
  try {
    const post = await findBySlugOrId(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    return res.json({ post: serializePost(req, post) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /blogs/upload: upload blog image — stored as base64 data URL in MongoDB.
export const uploadBlogImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required." });
  }

  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  return res.status(201).json({ url: dataUrl });
};

// POST /blogs: create a blog post.
export const createBlog = async (req, res) => {
  try {
    const payload = toPayload(req.body);
    if (!payload.title || !payload.description) {
      return res.status(400).json({
        message: "Title and description are required.",
      });
    }
    payload.slug = await ensureUniqueSlug(slugify(payload.title));
    const post = await Blog.create(payload);
    return res.status(201).json({ post: serializePost(req, post) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /blogs/:id: update a blog post.
export const updateBlog = async (req, res) => {
  try {
    const payload = toPayload(req.body);
    if (!payload.title || !payload.description) {
      return res.status(400).json({
        message: "Title and description are required.",
      });
    }

    const post = await findBySlugOrId(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    payload.slug = await ensureUniqueSlug(
      slugify(payload.title),
      post._id,
    );

    Object.assign(post, payload);
    await post.save();

    return res.json({ post: serializePost(req, post) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /blogs/:id: remove a blog post.
export const deleteBlog = async (req, res) => {
  try {
    const post = await findBySlugOrId(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    await post.deleteOne();
    return res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /blogs/:id/like: increment like counter.
export const likeBlog = async (req, res) => {
  try {
    const post = await findBySlugOrId(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }
    post.likes = (post.likes || 0) + 1;
    await post.save();
    return res.json({ post: serializePost(req, post) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /blogs/:id/related: get related posts.
export const getRelatedBlogs = async (req, res) => {
  try {
    const post = await findBySlugOrId(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const tag = post.tag;
    const query = { _id: { $ne: post._id } };
    if (tag) {
      query.tag = tag;
    }

    const related = await Blog.find(query).sort({ updatedAt: -1 }).limit(5);
    res.json({ posts: related.map((item) => serializePost(req, item)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
