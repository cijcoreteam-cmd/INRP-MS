import { NextFunction, Request, Response } from "express";
import createError from "http-errors";


export function notFound(_req: Request, _res: Response, next: NextFunction) {
next(createError(404, "Not Found"));
}


export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
const status = err.status || 500;
const message = err.expose ? err.message : "Internal Server Error";
const details = err.expose ? err.details : undefined;
res.status(status).json({ error: { message, details } });
}