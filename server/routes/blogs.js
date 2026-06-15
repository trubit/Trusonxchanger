import express from "express";
import {
  createBlog,
  deleteBlog,
  getBlog,
  getRelatedBlogs,
  likeBlog,
  listBlogs,
  uploadBlogImage,
  updateBlog,
} from "../controllers/blogsController.js";
import { blogImageUpload } from "../middleware/blogUpload.js";
import { requireAuth } from "../middleware/auth.js";

// Blog CRUD and interaction routes.
const router = express.Router();

// Public routes.
router.get("/", listBlogs);
router.get("/:id", getBlog);
router.get("/:id/related", getRelatedBlogs);
router.post("/:id/like", likeBlog);

// Authenticated write routes.
router.post(
  "/upload",
  requireAuth,
  blogImageUpload.single("image"),
  uploadBlogImage,
);
router.post("/", requireAuth, createBlog);
router.put("/:id", requireAuth, updateBlog);
router.delete("/:id", requireAuth, deleteBlog);

export default router;
