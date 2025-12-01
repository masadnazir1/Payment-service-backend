import { z } from 'zod';

export const PlanSchemas = {
  idParam: z.object({
    id: z
      .string()
      .transform((v) => Number(v))
      .refine((v) => Number.isInteger(v)),
  }),

  getParam: z.object({
    planName: z.string().trim().toLowerCase(),
  }),

  create: z.object({
    vendorName: z.string().trim(),
    planName: z.string().trim(),
    price: z.number().positive(),
  }),

  update: z.object({
    vendorName: z.string().trim().optional(),
    planName: z.string().trim().optional(),
    price: z.number().positive().optional(),
  }),
};
