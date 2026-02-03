import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env"; // assume env is properly typed

// ✅ Strongly typed payload
export type JwtPayload = {
  sub: string;
  role: "EDITOR" | "REPORTER";
  tokenVersion: number;
  email?: string;
};

// ✅ Secrets must be strings
const accessSecret = env.ACCESS_TOKEN_SECRET as string;
const refreshSecret = env.REFRESH_TOKEN_SECRET as string;

// ✅ Expirations must match SignOptions["expiresIn"] type (string | number)
const accessExpiresIn: SignOptions["expiresIn"] =
  (env.ACCESS_TOKEN_TTL as any) || "12h";

const refreshExpiresIn: SignOptions["expiresIn"] =
  (env.REFRESH_TOKEN_TTL as any) || "7d";

// 🔑 Generate Access Token
export const signAccess = (payload: JwtPayload): string =>
  jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn });

// 🔑 Generate Refresh Token
export const signRefresh = (payload: JwtPayload): string =>
  jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });

// 🔎 Verify Access Token
export const verifyAccess = (token: string): JwtPayload =>
  jwt.verify(token, accessSecret) as JwtPayload;

// 🔎 Verify Refresh Token
export const verifyRefresh = (token: string): JwtPayload =>
  jwt.verify(token, refreshSecret) as JwtPayload;
