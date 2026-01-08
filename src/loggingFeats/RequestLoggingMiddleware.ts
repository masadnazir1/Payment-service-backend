import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { FileLogger } from './FileLogger.js';
import { RequestContext } from './RequestContext.js';

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
  // fallback
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

// Ensure req.ctx exists in typings if you haven’t already
// declare global {
//   namespace Express {
//     interface Request {
//       ctx?: RequestContext;
//       requestId?: string;
//     }
//   }
// }

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const ctx = new RequestContext();
  req.ctx = ctx;

  // If you want to accept external request-id:
  const incomingId =
    (req.headers['x-request-id'] as string | undefined) ||
    (req.headers['x-correlation-id'] as string | undefined);

  const requestId = incomingId || ctx.requestId || crypto.randomUUID();
  // keep consistent
  // @ts-ignore
  ctx.requestId = requestId;
  // @ts-ignore
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  let responseBody: any;

  const json = res.json.bind(res);
  res.json = (body: any) => {
    responseBody = body;
    return json(body);
  };

  const send = res.send.bind(res);
  res.send = (body: any) => {
    responseBody = body;
    return send(body);
  };

  // start log (optional, but you already do it)
  FileLogger.info({
    timestamp: new Date().toISOString(),
    requestId,
    controller: 'HTTP',
    action: `${req.method} ${req.originalUrl}:start`,

    remoteIp: getClientIp(req),
    domain: getDomain(req),
    userAgent: (req.headers['user-agent'] as string) || '-',

    headers: safeHeaders(req.headers),
    query: redactDeep(req.query),
    body: redactDeep(req.body),
    // NOTE: req.cookies requires cookie-parser middleware, otherwise undefined
    // @ts-ignore
    cookies: redactDeep((req as any).cookies),
    response: { note: 'request started' },
  });

  res.on('finish', () => {
    const statusCode = res.statusCode;

    const entry = {
      timestamp: new Date().toISOString(),
      requestId,
      controller: 'HTTP',
      action: `${req.method} ${req.originalUrl}:end`,
      durationMs: ctx.duration(),

      remoteIp: getClientIp(req),
      domain: getDomain(req),
      userAgent: (req.headers['user-agent'] as string) || '-',

      headers: safeHeaders(req.headers),
      query: redactDeep(req.query),
      body: redactDeep(req.body),
      // @ts-ignore
      cookies: redactDeep((req as any).cookies),

      response: {
        statusCode,
        body: redactDeep(responseBody),
      },
    };

    if (statusCode >= 400) {
      FileLogger.error({
        ...entry,
        error: { message: `HTTP ${statusCode}` },
      });
    } else {
      FileLogger.info(entry);
    }
  });

  next();
}
