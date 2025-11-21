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

const router = express.Router();

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

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
  verifyRole("admin"),
  getDashboardStats
);

// --- POST ROUTES (CMS) ---
router.get("/posts", getAllPosts);
router.get("/posts/:slug", getPostBySlug);

router.post(
  "/posts",
  authenticateToken,
  verifyRole("admin", "editor"),
  upload.single("image"),
  createPost
);

router.put(
  "/posts/:id",
  authenticateToken,
  verifyRole("admin", "editor"),
  upload.single("image"),
  updatePost
);

router.delete("/posts/:id", authenticateToken, verifyRole("admin"), deletePost);

// --- ADMIN: USERS ---
router.get("/admin/users", authenticateToken, verifyRole("admin"), getAllUsers);
router.post("/admin/users", authenticateToken, verifyRole("admin"), createUser);
router.put(
  "/admin/users/:id",
  authenticateToken,
  verifyRole("admin"),
  updateUser
);
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

// --- ADMIN: ROLES ---
router.get("/admin/roles", authenticateToken, verifyRole("admin"), getAllRoles);
router.post("/admin/roles", authenticateToken, verifyRole("admin"), createRole);
router.put(
  "/admin/roles/:id",
  authenticateToken,
  verifyRole("admin"),
  updateRole
);
router.delete(
  "/admin/roles/:id",
  authenticateToken,
  verifyRole("admin"),
  deleteRole
);

// --- ADMIN: PERMISSIONS ---
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
router.put(
  "/admin/permissions/:id",
  authenticateToken,
  verifyRole("admin"),
  updatePermission
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
