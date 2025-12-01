import dotenv from 'dotenv';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

export class ApiKeyMiddleware {
  // Fetch allowed API keys from environment variable (comma-separated)
  private static allowedKeys: string[] = process.env.API_KEYS
    ? process.env.API_KEYS.split(',').map((key) => key.trim())
    : [];

  static handle(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key missing',
      });
    }

    if (!ApiKeyMiddleware.allowedKeys.includes(apiKey)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid API key',
      });
    }

    next();
  }
}
