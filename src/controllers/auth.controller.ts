import { Request, Response } from "express";
import { z } from "zod";
import createError from "http-errors";
import * as auth from "../services/auth.service";
import * as users from "../services/user.service";
import { env } from "../config/env";

// ---------- Validation Schemas ----------
export const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["EDITOR", "REPORTER"])
  })
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

// ---------- Helper ----------
function setRefreshCookie(res: Response, token: string) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.COOKIE_SECURE,
    path: "/api/auth/refresh",
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  });
}

// ---------- Controllers ----------
export async function register(req: Request, res: Response) {
  try {
    const { email, password, role, username } = req.body as {
      email: string;
      password: string;
      username: string;
      role: "EDITOR" | "REPORTER";
    };
    const { accessToken, refreshToken } = await auth.register(email, password, username, role);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken });
  } catch (e: any) {
    throw createError(400, e.message);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { accessToken, refreshToken } = await auth.login(email, password);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  } catch (e: any) {
    throw createError(400, e.message);
  }
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw createError(401, "Unauthenticated");
  const user = await users.getById(req.user.id);
  if (!user) throw createError(404, "User not found");
  res.json({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt });
}
