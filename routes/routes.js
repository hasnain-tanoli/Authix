import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { verifyRole } from "../middleware/verifyRoles.js";
import {
  handleLogin,
  handleSignup,
  getUserProfile,
  handleRefreshToken,
  handleLogout,
} from "../controllers/userController.js";
import {
  createPost,
  getAllPosts,
  getPostBySlug,
  deletePost,
} from "../controllers/postController.js";
import {
  createRole,
  getAllRoles,
  deleteRole,
  createPermission,
  getAllPermissions,
  deletePermission,
  assignPermissionToRole,
  assignRoleToUser,
  getAllUsers,
  deleteUser,
} from "../controllers/adminController.js";
import { uploadMedia, updatePost } from "../controllers/cmsController.js";
import { getDashboardStats } from "../controllers/statsController.js"; // New

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({ storage });

// Auth
router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/token", handleRefreshToken);
router.post("/logout", handleLogout);
router.get("/profile", authenticateToken, getUserProfile);

// Stats
router.get(
  "/admin/stats",
  authenticateToken,
  verifyRole("admin"),
  getDashboardStats
);

// Post CRUD
router.get("/posts", getAllPosts);
router.get("/posts/:slug", getPostBySlug);
router.post(
  "/posts",
  authenticateToken,
  verifyRole("admin", "editor"),
  createPost
);
router.put(
  "/posts/:id",
  authenticateToken,
  verifyRole("admin", "editor"),
  updatePost
);
router.delete("/posts/:id", authenticateToken, verifyRole("admin"), deletePost);
router.post(
  "/upload",
  authenticateToken,
  verifyRole("admin", "editor"),
  upload.single("file"),
  uploadMedia
);

// Admin CRUD - Users
router.get("/admin/users", authenticateToken, verifyRole("admin"), getAllUsers);
router.delete(
  "/admin/users/:id",
  authenticateToken,
  verifyRole("admin"),
  deleteUser
);
router.post(
  "/admin/assign-role",
  authenticateToken,
  verifyRole("admin"),
  assignRoleToUser
);

// Admin CRUD - Roles
router.get("/admin/roles", authenticateToken, verifyRole("admin"), getAllRoles);
router.post("/admin/roles", authenticateToken, verifyRole("admin"), createRole);
router.delete(
  "/admin/roles/:id",
  authenticateToken,
  verifyRole("admin"),
  deleteRole
);

// Admin CRUD - Permissions
router.get(
  "/admin/permissions",
  authenticateToken,
  verifyRole("admin"),
  getAllPermissions
);
router.post(
  "/admin/permissions",
  authenticateToken,
  verifyRole("admin"),
  createPermission
);
router.delete(
  "/admin/permissions/:id",
  authenticateToken,
  verifyRole("admin"),
  deletePermission
);
router.post(
  "/admin/assign-perm",
  authenticateToken,
  verifyRole("admin"),
  assignPermissionToRole
);

export default router;
