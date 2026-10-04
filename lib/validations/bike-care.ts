import { z } from 'zod';

export const predefinedBikeCareCategories = [
  'Engine Oil',
  'Oil Filter',
  'Air Filter',
  'Chain Cleaning',
  'Chain Lubrication',
  'Chain Inspection',
  'Bike Wash',
  'Brake Inspection',
  'Brake Pad',
  'Brake Fluid',
  'Tyre Inspection',
  'Tyre Replacement',
  'Battery',
  'Spark Plug',
  'Coolant',
  'General Service',
  'PUC',
  'Insurance',
  'Repair',
  'Detailing',
  'Other',
] as const;

export const performedByOptions = ['SELF', 'SERVICE_CENTER', 'LOCAL_MECHANIC', 'OTHER'] as const;

export const createBikeCareSchema = z.object({
  bikeId: z.string().min(1, 'Bike is required'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  performedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  performedAtOdometer: z.coerce.number().min(0, 'Odometer cannot be negative'),
  description: z.string().min(1, 'Description is required').max(500),
  performedBy: z.enum(performedByOptions).default('SELF'),
  providerName: z.string().optional(),
  location: z.string().optional(),
  cost: z.coerce.number().min(0, 'Cost cannot be negative').default(0),
  paymentMethod: z.string().optional(),
  duration: z.string().optional(),
  notes: z.string().max(1000).optional(),
  receiptUrl: z.string().optional(),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be formatted as YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  nextDueOdometer: z.coerce.number().min(0).optional(),
  reminderEnabled: z.boolean().default(true),
  status: z.enum(['completed', 'upcoming', 'due', 'overdue']).default('completed'),
});

export const updateBikeCareSchema = createBikeCareSchema.partial().omit({ bikeId: true });
