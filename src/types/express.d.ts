import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email?: string;
    [key: string]: any; // optional extra fields
  };
}
