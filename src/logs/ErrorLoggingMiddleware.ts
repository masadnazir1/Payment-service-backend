import type { NextFunction, Request, Response } from 'express';
import { FileLogger } from './FileLogger.js';

export function errorLoggingMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  FileLogger.error({
    timestamp: new Date().toISOString(),
    requestId: req.ctx?.requestId ?? 'NO_CTX',
    controller: 'HTTP',
    action: 'unhandled:error',
    error: {
      message: err.message,
      stack: err.stack,
    },
  });

  console.log(res);
  next(err);
}
