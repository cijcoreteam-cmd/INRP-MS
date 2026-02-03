import { PrismaClient, Role } from "@prisma/client";
import { hash, verify } from "../libs/bcrypt";
import { signAccess, signRefresh } from "../libs/jwt";
import * as auth from "./user.service";

const prisma = new PrismaClient();

export async function register(
  email: string,
  password: string,
  username: string,
  role: Role
) {
  const existing = await auth.findByEmail(email);
  if (existing) throw new Error("Email already registered");
  const passwordHash = await hash(password);
  const user = await auth.createUser(email, passwordHash, username, role);
  return issueTokens(user.id, user.role, user.tokenVersion, username);
}

export async function login(email: string, password: string) {
  const user = await auth.findByEmail(email);
  if (!user) throw new Error("Invalid credentials");
  const ok = await verify(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");
  return issueTokens(
    user.id,
    user.role,
    user.tokenVersion,
    user.username ?? ""
  );
}

export function issueTokens(
  userId: string,
  role: Role,
  tokenVersion: number,
  username: string
) {
  const payload = { sub: userId, role, tokenVersion, username } as const;
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);
  return { accessToken, refreshToken };
}

export const getById = (id: string) =>
  prisma.user.findUnique({ where: { id } });
