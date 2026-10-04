import { z } from 'zod';

export const intervalModes = ['KM', 'DAYS', 'KM_OR_DAYS', 'KM_AND_DAYS'] as const;

export const createBikeCareRuleSchema = z.object({
  bikeId: z.string().min(1, 'Bike is required'),
  category: z.string().min(1, 'Category is required'),
  defaultIntervalKm: z.coerce.number().min(1).optional(),
  defaultIntervalDays: z.coerce.number().min(1).optional(),
  intervalMode: z.enum(intervalModes).default('KM_OR_DAYS'),
  enabled: z.boolean().default(true),
  notes: z.string().max(500).optional(),
});

export const updateBikeCareRuleSchema = createBikeCareRuleSchema.partial().omit({ bikeId: true, category: true });
