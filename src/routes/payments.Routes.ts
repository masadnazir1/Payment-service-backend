import { Router } from 'express';
import { PaymentsController } from '../controllers/payments.Controller.js';

export class PaymentRoutes {
  public router = Router();
  private controller = new PaymentsController();

  constructor() {
    this.router.get('/payment-methods', this.controller.list.bind(this.controller));
    this.router.post('/payment-methods', this.controller.addPaymentMethod.bind(this.controller));
    //update
    this.router.put('/', this.controller.updatePaymentMethod.bind(this.controller));
    //charge
    this.router.post('/charge', this.controller.charge.bind(this.controller));
    //delete
    this.router.delete('/', this.controller.deletePaymentMethod.bind(this.controller));
  }
}
