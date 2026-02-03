import { User } from "@prisma/client"; // adjust if using your own User type

interface JwtUser {
  id: string;
  email?: string;
  role: "EDITOR" | "REPORTER";
  tokenVersion: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}
