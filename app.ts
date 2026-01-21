import cookieParser from 'cookie-parser';
import express from 'express';
import { errorLoggingMiddleware } from './src/loggingFeats/ErrorLoggingMiddleware.js';
import { requestLoggingMiddleware } from './src/loggingFeats/RequestLoggingMiddleware.js';
import { CorsMiddleware } from './src/middlewares/Cors.Middleware.js';

export class App {
  public app = express();

  constructor() {
    this.app.use(express.json());
    this.app.use(requestLoggingMiddleware);
    this.app.use(CorsMiddleware.handle);
    this.app.use(cookieParser());
    this.app.use(errorLoggingMiddleware);
  }

  mountRouter(path: string, router: express.Router) {
    this.app.use(path, router);
  }
}
