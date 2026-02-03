export class AppError extends Error { status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export const Forbidden = (m="Forbidden") => new AppError(403, m);
export const NotFound = (m="Not Found") => new AppError(404, m);
export const BadRequest = (m="Bad Request") => new AppError(400, m);
