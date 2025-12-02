import type { NextFunction, Request, Response } from 'express';

export class CorsMiddleware {
  private static allowedDomains = [
    'http://localhost:3000',
    'https://payments.galaxydev.pk',
    'http://localhost:5173',
    'http://localhost',
    'http://localhost:',
    'http://127.0.0.1:5501',
    'https://carebusinessconsultingsolutions.com',
    'https://fabzsolutions.com/checkout/',

    // add more here...
  ];

  static handle(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    if (origin && CorsMiddleware.allowedDomains.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With,x-api-key',
    );
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.sendStatus(204);

    next();
  }
}
