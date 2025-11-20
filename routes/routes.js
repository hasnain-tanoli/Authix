import express from "express";
import {
  handleLogin,
  handleSignup,
  getUserProfile,
  handleRefreshToken,
  handleLogout,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authenticateToken.js";

const router = express.Router();

router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/token", handleRefreshToken);
router.post("/logout", handleLogout);

router.get("/profile", authenticateToken, getUserProfile);

export default router;
