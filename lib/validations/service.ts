import { z } from 'zod';

export const serviceItemSchema = z.object({
  id: z.string().optional(),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  totalPrice: z.coerce.number().min(0, 'Total price cannot be negative'),
  notes: z.string().optional(),
});

export const createServiceSchema = z.object({
  bikeId: z.string().min(1, 'Bike is required'),
  serviceNumber: z.string().min(1, 'Service number is required'),
  serviceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  odometer: z.coerce.number().min(0, 'Odometer cannot be negative'),
  serviceCenter: z.string().min(1, 'Service center is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  totalCost: z.coerce.number().min(0, 'Total cost cannot be negative'),
  labourCost: z.coerce.number().min(0).default(0),
  partsCost: z.coerce.number().min(0).default(0),
  otherCost: z.coerce.number().min(0).default(0),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().max(1000).optional(),
  items: z.array(serviceItemSchema).default([]),
  nextServiceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  nextServiceOdometer: z.coerce.number().min(0).optional(),
});

export const updateServiceSchema = createServiceSchema.partial().omit({ bikeId: true });
