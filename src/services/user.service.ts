import { PrismaClient, Role } from "@prisma/client";
const prisma = new PrismaClient();

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const createUser = (
  email: string,
  passwordHash: string,
  username: string,
  role: Role
) => prisma.user.create({ data: { email, passwordHash, username, role } });

export const bumpTokenVersion = (userId: string) =>
  prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });

export const getById = (id: string) =>
  prisma.user.findUnique({ where: { id } });
