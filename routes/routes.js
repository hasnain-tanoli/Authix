import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { verifyRole } from "../middleware/verifyRoles.js";
import { verifyPermission } from "../middleware/verifyPermission.js";
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
  updatePost,
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
  createUser,
  updateUser,
  updateRole,
  updatePermission,
} from "../controllers/adminController.js";
import { getDashboardStats } from "../controllers/statsController.js";

import { getMedia } from "../controllers/mediaController.js";

const router = express.Router();

// --- MULTER CONFIGURATION ---
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  },
});

// --- AUTH ROUTES ---
router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/token", handleRefreshToken);
router.post("/logout", handleLogout);
router.get("/profile", authenticateToken, getUserProfile);

// --- DASHBOARD STATS ---
router.get(
  "/admin/stats",
  authenticateToken,
  verifyPermission("dashboard.read"),
  getDashboardStats
);

// --- MEDIA ROUTES ---
router.get("/media/:id", getMedia);

// --- POST ROUTES (CMS) ---
router.get("/posts", authenticateToken, verifyPermission("posts.read"), getAllPosts);
router.get("/posts/slug/:slug", authenticateToken, verifyPermission("posts.read"), getPostBySlug);
router.get("/posts/:slug", authenticateToken, verifyPermission("posts.read"), getPostBySlug);

router.post(
  "/posts",
  authenticateToken,
  verifyPermission("posts.create"),
  upload.single("image"),
  createPost
);

router.put(
  "/posts/:id",
  authenticateToken,
  verifyPermission("posts.update"),
  upload.single("image"),
  updatePost
);

router.delete("/posts/:id", authenticateToken, verifyPermission("posts.delete"), deletePost);

// --- ADMIN: USERS ---
router.get("/admin/users", authenticateToken, verifyPermission("users.read"), getAllUsers);
router.post("/admin/users", authenticateToken, verifyPermission("users.create"), createUser);
router.put(
  "/admin/users/:id",
  authenticateToken,
  verifyPermission("users.update"),
  updateUser
);
router.delete(
  "/admin/users/:id",
  authenticateToken,
  verifyPermission("users.delete"),
  deleteUser
);
router.post(
  "/admin/assign-role",
  authenticateToken,
  verifyPermission("users.update"),
  assignRoleToUser
);

// --- ADMIN: ROLES ---
router.get("/admin/roles", authenticateToken, verifyPermission("roles.read"), getAllRoles);
router.post("/admin/roles", authenticateToken, verifyPermission("roles.create"), createRole);
router.put(
  "/admin/roles/:id",
  authenticateToken,
  verifyPermission("roles.update"),
  updateRole
);
router.delete(
  "/admin/roles/:id",
  authenticateToken,
  verifyPermission("roles.delete"),
  deleteRole
);

// --- ADMIN: PERMISSIONS ---
router.get(
  "/admin/permissions",
  authenticateToken,
  verifyPermission("permissions.read"),
  getAllPermissions
);
router.post(
  "/admin/permissions",
  authenticateToken,
  verifyPermission("permissions.create"),
  createPermission
);
router.put(
  "/admin/permissions/:id",
  authenticateToken,
  verifyPermission("permissions.update"),
  updatePermission
);
router.delete(
  "/admin/permissions/:id",
  authenticateToken,
  verifyPermission("permissions.delete"),
  deletePermission
);
router.post(
  "/admin/assign-perm",
  authenticateToken,
  verifyPermission("roles.update"),
  assignPermissionToRole
);

export default router;
