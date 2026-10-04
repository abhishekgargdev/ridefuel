import { z } from 'zod';

export const fuelLogSchema = z.object({
  bikeId: z.string().min(1, 'Bike selection is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  time: z.string().optional(),
  odometer: z.number().positive('Odometer reading must be a positive number'),
  fuelQuantity: z.number().positive('Fuel quantity must be greater than 0'),
  pricePerLiter: z.number().positive('Price per liter must be greater than 0'),
  totalAmount: z.number().positive('Total amount must be greater than 0'),
  isFullTank: z.boolean().default(false),
  fuelStation: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  paymentMethod: z.string().max(50).optional().default('UPI'),
  notes: z.string().max(500).optional(),
});

export const updateFuelLogSchema = fuelLogSchema.partial();
