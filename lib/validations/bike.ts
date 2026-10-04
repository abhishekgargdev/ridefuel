import { z } from 'zod';

export const bikeSchema = z.object({
  name: z.string().min(2, 'Bike nickname must be at least 2 characters').max(60),
  manufacturer: z.string().min(2, 'Manufacturer is required').default('Royal Enfield'),
  model: z.string().min(1, 'Model is required').default('Classic 350'),
  variant: z.string().optional(),
  year: z
    .number()
    .int()
    .min(1950, 'Year must be after 1950')
    .max(new Date().getFullYear() + 2, 'Year cannot be in the far future'),
  registrationNumber: z.string().max(20).optional(),
  purchaseDate: z.string().optional(),
  initialOdometer: z.number().min(0, 'Initial odometer cannot be negative'),
  currentOdometer: z.number().min(0, 'Current odometer cannot be negative').optional(),
  tankCapacity: z.number().positive('Tank capacity must be greater than 0').max(100),
  reserveCapacity: z.number().min(0).max(30).optional().default(2.6),
  expectedMileage: z.number().positive('Expected mileage must be greater than 0').max(150),
  isActive: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional(),
});

export const updateBikeSchema = bikeSchema.partial();
