import { Router } from 'express';
import { ApiKeyMiddleware } from '../middlewares/ApiKey.Middleware.js';
import { PaymentRoutes } from './payments.Routes.js';
import { VendorPlansRoutes } from './vendorPlans.Routes.js';
export const registerRoutes = (app: Router, basePath = '') => {
  // sub-router for versioning
  const apiRouter = Router();

  const paymentRoutes = new PaymentRoutes();
  const vendorPlansRoutes = new VendorPlansRoutes();

  apiRouter.use('/payments', ApiKeyMiddleware.handle, paymentRoutes.router);
  apiRouter.use('/vendor-plans', ApiKeyMiddleware.handle, vendorPlansRoutes.router);

  app.use(`${basePath}`, apiRouter);
};
