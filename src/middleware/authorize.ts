// middlewares/authorize.ts
import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export const authorize =
    (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        next();
    };
