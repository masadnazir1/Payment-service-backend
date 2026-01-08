import type { NextFunction, Request, Response } from 'express';
import { FileLogger } from './FileLogger.js';
import { RequestContext } from './RequestContext.js';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const ctx = new RequestContext();
  req.ctx = ctx;

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

  FileLogger.info({
    timestamp: new Date().toISOString(),
    requestId: ctx.requestId,
    controller: 'HTTP',
    action: `${req.method} ${req.originalUrl}:start`,
    request: {
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body,
    },
  });

  res.on('finish', () => {
    const status = res.statusCode;

    const entry = {
      timestamp: new Date().toISOString(),
      requestId: ctx.requestId,
      controller: 'HTTP',
      action: `${req.method} ${req.originalUrl}:end`,
      durationMs: ctx.duration(),
      response: responseBody,
    };

    if (status >= 400) {
      FileLogger.error({
        ...entry,
        error: { message: `HTTP ${status}` },
      });
    } else {
      FileLogger.info(entry);
    }
  });

  next();
}
