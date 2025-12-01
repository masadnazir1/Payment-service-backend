import type { Request, Response } from 'express';
import { VendorPlansRepository } from '../repositories/VendorPlans.Repository.js';
import type { AuthRequest } from '../types/express.js';
import { ResponseHandler } from '../utils/ResponseHandler.js';

export class VendorPlansController {
  // List all vendor plans
  async list(req: Request, res: Response) {
    try {
      console.log('req in list plans', req);
      const plans = await VendorPlansRepository.listAll();
      return ResponseHandler.success(res, plans, 'Vendor plans fetched successfully');
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || 'Failed to fetch vendor plans');
    }
  }

  // Get a single vendor plan by ID
  async get(req: AuthRequest, res: Response) {
    try {
      const { planName } = req.params;
      if (!planName) return ResponseHandler.error(res, 'Missing plan plan_name', 400);

      const plan = await VendorPlansRepository.getByPlanName(planName?.toLowerCase().toString());
      if (!plan) return ResponseHandler.error(res, 'Vendor plan not found', 404);

      return ResponseHandler.success(res, plan, 'Vendor plan fetched successfully');
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || 'Failed to fetch vendor plan');
    }
  }
  // Get plans by vendor name
  async getByVendor(req: AuthRequest, res: Response) {
    try {
      const { vendorName } = req.query;
      if (!vendorName) return ResponseHandler.error(res, 'Missing plan vendorName', 400);

      const plan = await VendorPlansRepository.getByVendor(vendorName.toString().toLowerCase());

      if (!plan) return ResponseHandler.error(res, 'No plan exist for this Vendor', 404);

      return ResponseHandler.success(res, plan, 'Vendor plan fetched successfully');
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || 'Failed to fetch vendor plan');
    }
  }

  // Create a new vendor plan
  async create(req: AuthRequest, res: Response) {
    try {
      const { vendorName, planName, price } = req.body;
      if (!vendorName || !planName || price === undefined)
        return ResponseHandler.error(res, 'vendorName, planName, and price are required', 400);

      const plan = await VendorPlansRepository.create(vendorName, planName, Number(price));
      return ResponseHandler.success(res, plan, 'Vendor plan created successfully', 201);
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || 'Failed to create vendor plan');
    }
  }

  // Update an existing vendor plan
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { vendorName, planName, price } = req.body;

      if (!id) return ResponseHandler.error(res, 'Missing plan ID', 400);

      const plan = await VendorPlansRepository.update(
        Number(id),
        vendorName,
        planName,
        price !== undefined ? Number(price) : undefined,
      );
      return ResponseHandler.success(res, plan, 'Vendor plan updated successfully');
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || 'Failed to update vendor plan');
    }
  }

  // Delete a vendor plan
  async delete(req: AuthRequest, res: Response) {
    try {
      const { vendorName, planName } = req.query;
      if (!vendorName || !planName)
        return ResponseHandler.error(res, 'Missing plan parameters', 400);

      const exists = await VendorPlansRepository.hasPlan(
        vendorName.toString().toLowerCase(),
        planName.toString().toLowerCase(),
      );

      if (!exists) return ResponseHandler.error(res, 'No plan exists for this vendor', 404);

      await VendorPlansRepository.delete(
        vendorName.toString().toLowerCase(),
        planName.toString().toLowerCase(),
      );

      return ResponseHandler.success(res, null, 'Vendor plan deleted successfully');
    } catch (err: any) {
      return ResponseHandler.error(res, err.message || 'Failed to delete vendor plan');
    }
  }
}
