import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ error: message });
}
