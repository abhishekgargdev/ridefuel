import { z } from 'zod';

export const dateFilterSchema = z.object({
  timeRange: z.enum(['7d', '30d', '3m', '6m', '1y', 'custom']).default('30d'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bikeId: z.string().optional(),
});
