import { Router } from 'express';
import { VendorPlansController } from '../controllers/plans.Controller.js';

export class VendorPlansRoutes {
  public router = Router();
  private controller = new VendorPlansController();

  //
  //
  constructor() {
    // List all vendor plans
    this.router.get('/', this.controller.list.bind(this.controller));

    // Get by vendor name:  /vendor?vendorName=abc
    this.router.get('/vendor', this.controller.getByVendor.bind(this.controller));

    // Get a single vendor plan by planName
    this.router.get('/:planName', this.controller.get.bind(this.controller));

    // Create a new vendor plan
    this.router.post('/', this.controller.create.bind(this.controller));

    // Update an existing vendor plan
    this.router.put('/vendor', this.controller.update.bind(this.controller));

    // Delete a vendor plan
    this.router.delete('/:id', this.controller.delete.bind(this.controller));
  }
}
