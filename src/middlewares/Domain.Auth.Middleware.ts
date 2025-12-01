import dotenv from 'dotenv';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

export class DomainAuthMiddleware {
  // List of allowed domains can come from env or be hardcoded
  private static allowedDomains: string[] = (process.env.ALLOWED_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim());

  static handle(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    if (!origin || !DomainAuthMiddleware.allowedDomains.includes(origin)) {
      return res.status(403).json({
        success: false,
        message: 'Domain not authorized',
      });
    }

    next();
  }
}
