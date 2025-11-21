import bcrypt from "bcrypt";
import { User, Role, Permission } from "../db/connection.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import { generateAccessAndRefreshTokens } from "./auth/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 24 * 60 * 60 * 1000,
};

export const handleSignup = asyncHandler(async (req, res) => {
  const { username, name, email, password } = req.body;

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ username: username }, { email: email }],
    },
  });

  if (existingUser) {
    if (existingUser.username === username) {
      return res.status(400).json({ error: "Username already exists" });
    }
    if (existingUser.email === email) {
      return res.status(400).json({ error: "Email already exists" });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    username,
    email,
    password: hashedPassword,
  });

  // Auto-assign user role to new signups
  const userRole = await Role.findOne({ where: { name: "user" } });
  if (userRole) {
    await user.addRole(userRole);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user
  );

  res.cookie("jwt", refreshToken, cookieOptions);
  res.cookie("access_token", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });

  res.status(201).json({
    message: "User created successfully",
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    },
    accessToken,
  });
});

export const handleLogin = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  const user = await User.findOne({
    where: {
      [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user
  );

  res.cookie("jwt", refreshToken, cookieOptions);
  res.cookie("access_token", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });

  res.status(200).json({
    message: "Login successful",
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    },
    accessToken,
  });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ["id", "username", "name", "email"],
    include: {
      model: Role,
      attributes: ["id", "name"],
      through: { attributes: [] },
      include: {
        model: Permission,
        attributes: ["id", "name", "action", "resource"],
        through: { attributes: [] },
      },
    },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  // Set cache headers for 5 minutes
  res.set('Cache-Control', 'private, max-age=300');
  res.json(user);
});

export const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(401);

  const refreshToken = cookies.jwt;

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findOne({ where: { id: decoded.id } });

  if (!user || user.refreshToken !== refreshToken) {
    return res.sendStatus(403);
  }

  const accessToken = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  res.cookie("access_token", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.json({ message: "Token refreshed" });
});

export const handleLogout = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(204);

  const refreshToken = cookies.jwt;

  const user = await User.findOne({ where: { refreshToken: refreshToken } });
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie("jwt", cookieOptions);
  res.clearCookie("access_token", cookieOptions);

  return res.sendStatus(204);
});
