import express from 'express';
import { CorsMiddleware } from './src/middlewares/Cors.Middleware.js';
// import { DomainAuthMiddleware } from './src/middlewares/Domain.Auth.Middleware.js';

export class App {
  public app = express();

  constructor() {
    this.app.use(express.json());
    this.app.use(CorsMiddleware.handle);
    // this.app.use(DomainAuthMiddleware.handle);
  }

  mountRouter(path: string, router: express.Router) {
    this.app.use(path, router);
  }
}
