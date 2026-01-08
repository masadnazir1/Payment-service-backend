import { Request } from 'express';
import { RequestContext } from '../loggingFeats/RequestContext.ts';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email?: string;
    [key: string]: any; // optional extra fields
  };
}

declare module 'express-serve-static-core' {
  interface Request {
    ctx: RequestContext;
  }
}
