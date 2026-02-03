import { NextFunction, Response } from "express";
import createError from "http-errors";
import { AuthedRequest } from "./auth";


export const requireRole = (...roles: ("EDITOR" | "REPORTER")[]) => {
return (req: AuthedRequest, _res: Response, next: NextFunction) => {
const role = req.user?.role;
if (!role) throw createError(401, "Unauthenticated");
if (!roles.includes(role)) throw createError(403, "Forbidden");
next();
};
};