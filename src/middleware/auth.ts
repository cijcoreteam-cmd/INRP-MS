import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import { verifyAccess } from "../libs/jwt";
import { JwtUser } from "../types/express";

export interface AuthedRequest extends Request {
  user?: JwtUser;
}

export function authenticate(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer "))
    throw createError(401, "Missing or invalid Authorization header");
  const token = header.split(" ")[1];
  try {
    const payload = verifyAccess(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
    return next();
  } catch {
    throw createError(401, "Invalid or expired access token");
  }
}
