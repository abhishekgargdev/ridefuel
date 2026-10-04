import { z } from 'zod';

export const dailyReadingSchema = z.object({
  bikeId: z.string().min(1, 'Bike selection is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  odometer: z.number().positive('Odometer reading must be a positive number'),
  notes: z.string().max(500).optional(),
  allowCorrection: z.boolean().optional().default(false),
});

export const updateDailyReadingSchema = dailyReadingSchema.partial();
