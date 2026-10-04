import { z } from 'zod';

export const expenseCategories = [
  'Petrol',
  'Maintenance',
  'Repair',
  'Insurance',
  'Accessories',
  'Cleaning',
  'Parking',
  'Toll',
  'Other',
] as const;

export const expenseSchema = z.object({
  bikeId: z.string().min(1, 'Bike selection is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  category: z.enum(expenseCategories, {
    message: 'Please select a valid expense category',
  }),
  amount: z.number().positive('Amount must be greater than 0'),
  odometer: z.number().min(0).optional(),
  description: z.string().min(2, 'Description must be at least 2 characters').max(200),
  notes: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
});

export const updateExpenseSchema = expenseSchema.partial();
