import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ResponseHandler } from '../utils/ResponseHandler.js';

interface AuthRequest extends Request {
  user?: any;
}

export class AuthMiddleware {
  static verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ResponseHandler.error(res, 'Unauthorized', 401);
      }

      const token = authHeader.split(' ')[1];
      if (!token) return ResponseHandler.error(res, 'Unauthorized', 401);

      const secret = process.env.JWT_SECRET || 'secret_key';
      const decoded = jwt.verify(token, secret);

      req.user = decoded; // attach user payload
      next();
    } catch (err: any) {
      return ResponseHandler.error(res, 'Invalid token', 401);
    }
  }
}
