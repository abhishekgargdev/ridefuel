import { z } from 'zod';

export const maintenanceServiceTypes = [
  'Engine oil',
  'Oil filter',
  'Air filter',
  'Chain cleaning',
  'Chain lubrication',
  'Brake inspection',
  'Brake replacement',
  'Tyres',
  'Battery',
  'General service',
  'Insurance',
  'PUC',
  'Repair',
  'Other',
] as const;

export const maintenanceRecordSchema = z.object({
  bikeId: z.string().min(1, 'Bike selection is required'),
  serviceType: z.enum(maintenanceServiceTypes, {
    message: 'Please select a valid service type',
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  odometer: z.number().min(0, 'Odometer reading cannot be negative'),
  amount: z.number().min(0, 'Amount cannot be negative').default(0),
  workshop: z.string().max(100).optional(),
  description: z.string().min(2, 'Description is required').max(300),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next due date must be YYYY-MM-DD').optional().or(z.literal('')),
  nextDueOdometer: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['completed', 'upcoming', 'overdue']).default('completed'),
});

export const updateMaintenanceRecordSchema = maintenanceRecordSchema.partial();
