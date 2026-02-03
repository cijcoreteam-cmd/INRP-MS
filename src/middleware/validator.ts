import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import createError from "http-errors";


export const validate = (schema: ZodSchema<any>) => (req: Request, _res: Response, next: NextFunction) => {
const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
if (!parsed.success) {
const details = parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message }));
throw createError(400, "Validation failed", { details });
}
next();
};