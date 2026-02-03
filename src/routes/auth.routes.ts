import { Router } from "express";
import { validate } from "../middleware/validator";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/auth.controller";
import { verifyRefresh } from "../libs/jwt";
import * as users from "../services/user.service";
import createError from "http-errors";
import { env } from "../config/env";

const router = Router();

// --- Register & Login ---

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [EDITOR, REPORTER]
 *     responses:
 *       201:
 *         description: User registered successfully
 */

router.post("/register", validate(ctrl.RegisterSchema), ctrl.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token response
 */
router.post("/login", validate(ctrl.LoginSchema), ctrl.login);

// --- Refresh Token ---
router.post("/refresh", async (req, res) => {
  const token = req.cookies?.["refresh_token"];
  if (!token) throw createError(401, "Missing refresh token");

  try {
    const payload = verifyRefresh(token);
    const user = await users.getById(payload.sub);
    if (!user) throw createError(401, "Invalid refresh token");
    if (user.tokenVersion !== payload.tokenVersion)
      throw createError(401, "Refresh token revoked");

    // Rotate tokens
    const { signAccess, signRefresh } = await import("../libs/jwt");
    const newAccess = signAccess({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
    const newRefresh = signRefresh({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    res.cookie("refresh_token", newRefresh, {
      httpOnly: true,
      sameSite: "strict",
      secure: env.COOKIE_SECURE,
      path: "/api/auth/refresh",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({ accessToken: newAccess });
  } catch {
    throw createError(401, "Invalid or expired refresh token");
  }
});

// --- Logout ---
router.post("/logout", authenticate, async (req, res) => {
  if (!req.user) throw createError(401, "Unauthenticated");
  await users.bumpTokenVersion(req.user.id);
  res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
  res.status(204).send();
});

// --- Current User ---
router.get("/me", authenticate, ctrl.me);

export default router;
