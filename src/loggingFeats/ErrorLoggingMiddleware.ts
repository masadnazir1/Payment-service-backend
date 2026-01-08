import type { NextFunction, Request, Response } from 'express';
import { FileLogger } from './FileLogger.js';

function getClientIp(req: Request) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim().length) {
    return xff.split(',')[0]?.trim() ?? '-';
  }
  return req.ip || req.socket?.remoteAddress || '-';
}

function getDomain(req: Request) {
  const xfHost = req.headers['x-forwarded-host'];
  if (typeof xfHost === 'string' && xfHost.trim().length) return xfHost;
  const host = req.headers['host'];
  if (typeof host === 'string' && host.trim().length) return host;
  // @ts-ignore
  return (req.hostname as string) || '-';
}

function safeHeaders(headers: Request['headers']) {
  const h: Record<string, any> = { ...headers };
  if (h.authorization) h.authorization = '[REDACTED]';
  if (h.Authorization) h.Authorization = '[REDACTED]';
  return h;
}

function redactDeep(value: any) {
  if (!value || typeof value !== 'object') return value;

  const SENSITIVE = new Set([
    'password',
    'pass',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'secret',
    'apikey',
    'apiKey',
    'cardNumber',
    'cvv',
  ]);

  const walk = (v: any): any => {
    if (!v || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(walk);

    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) {
      if (SENSITIVE.has(k.toLowerCase())) out[k] = '[REDACTED]';
      else out[k] = walk(val);
    }
    return out;
  };

  return walk(value);
}

export function errorLoggingMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = req.ctx?.requestId ?? (req.headers['x-request-id'] as string) ?? 'NO_CTX';

  FileLogger.error({
    timestamp: new Date().toISOString(),
    requestId,
    controller: 'HTTP',
    action: `${req.method} ${req.originalUrl}:unhandled:error`,

    remoteIp: getClientIp(req),
    domain: getDomain(req),
    userAgent: (req.headers['user-agent'] as string) || '-',

    headers: safeHeaders(req.headers),
    query: redactDeep(req.query),
    body: redactDeep(req.body),
    // @ts-ignore
    cookies: redactDeep((req as any).cookies),

    response: {
      statusCode: res.statusCode,
    },

    error: {
      // name: err?.name,
      message: err?.message,
      stack: err?.stack,
    },
  });

  // Don’t log the whole res object (it’s huge and circular)
  next(err);
}
