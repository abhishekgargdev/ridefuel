/**
 * Maintenance Scheduler & Recurring Rule Engine
 * Supports Date-based, Odometer-based, KM_OR_DAYS, and KM_AND_DAYS intervals.
 */

import { BikeCareRule, IntervalMode } from '@/types';
import { getNextDueDate, getNextDueOdometer } from './bike-care-calculator';

export interface PredefinedCategoryRule {
  category: string;
  defaultIntervalKm?: number;
  defaultIntervalDays?: number;
  intervalMode: IntervalMode;
  notes: string;
}

export const PREDEFINED_CARE_RULES: PredefinedCategoryRule[] = [
  {
    category: 'Chain Lubrication',
    defaultIntervalKm: 300,
    defaultIntervalDays: 30,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Every 300 km or 30 days to avoid O-ring chain wear',
  },
  {
    category: 'Bike Wash',
    defaultIntervalDays: 7,
    intervalMode: 'DAYS',
    notes: 'Weekly wash to remove road grime and salt',
  },
  {
    category: 'Chain Cleaning',
    defaultIntervalKm: 500,
    defaultIntervalDays: 30,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Degrease and brush before fresh lube',
  },
  {
    category: 'Engine Oil',
    defaultIntervalKm: 5000,
    defaultIntervalDays: 180,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Royal Enfield 15W-50 semi/full synthetic engine oil',
  },
  {
    category: 'Oil Filter',
    defaultIntervalKm: 5000,
    defaultIntervalDays: 180,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Replace along with engine oil',
  },
  {
    category: 'Air Filter',
    defaultIntervalKm: 5000,
    defaultIntervalDays: 180,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Inspect/clean every 5,000 km, replace as required',
  },
  {
    category: 'Brake Inspection',
    defaultIntervalKm: 3000,
    defaultIntervalDays: 90,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Check disc pad thickness and master cylinder level',
  },
  {
    category: 'Brake Pad',
    defaultIntervalKm: 10000,
    defaultIntervalDays: 365,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Replace front/rear ByBre pads when groove disappears',
  },
  {
    category: 'Brake Fluid',
    defaultIntervalKm: 10000,
    defaultIntervalDays: 365,
    intervalMode: 'KM_OR_DAYS',
    notes: 'DOT 4 brake fluid bleed and flush',
  },
  {
    category: 'Tyre Inspection',
    defaultIntervalKm: 3000,
    defaultIntervalDays: 90,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Inspect tread depth, cracks, and tyre pressure',
  },
  {
    category: 'Tyre Replacement',
    defaultIntervalKm: 20000,
    defaultIntervalDays: 1095,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Front/rear Ceat Zoom Plus tyres',
  },
  {
    category: 'Battery',
    defaultIntervalKm: 3000,
    defaultIntervalDays: 90,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Terminal greasing and voltage check (12V 8Ah VRLA)',
  },
  {
    category: 'Spark Plug',
    defaultIntervalKm: 10000,
    defaultIntervalDays: 365,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Clean/gap Bosch twin spark plugs or replace',
  },
  {
    category: 'General Service',
    defaultIntervalKm: 5000,
    defaultIntervalDays: 180,
    intervalMode: 'KM_OR_DAYS',
    notes: 'Authorized workshop full service cycle',
  },
  {
    category: 'PUC',
    defaultIntervalDays: 180,
    intervalMode: 'DAYS',
    notes: 'Pollution Under Control certificate (every 6 months)',
  },
  {
    category: 'Insurance',
    defaultIntervalDays: 365,
    intervalMode: 'DAYS',
    notes: 'Annual comprehensive two-wheeler policy renewal',
  },
];

export function calculateNextDue(
  performedAt: string,
  performedAtOdometer: number,
  rule?: Partial<BikeCareRule>
): { nextDueDate?: string; nextDueOdometer?: number } {
  if (!rule) return {};

  let nextDueDate: string | undefined;
  let nextDueOdometer: number | undefined;

  const mode = rule.intervalMode || 'KM_OR_DAYS';

  if (mode === 'DAYS' || mode === 'KM_OR_DAYS' || mode === 'KM_AND_DAYS') {
    if (rule.defaultIntervalDays) {
      nextDueDate = getNextDueDate(performedAt, rule.defaultIntervalDays);
    }
  }

  if (mode === 'KM' || mode === 'KM_OR_DAYS' || mode === 'KM_AND_DAYS') {
    if (rule.defaultIntervalKm) {
      nextDueOdometer = getNextDueOdometer(performedAtOdometer, rule.defaultIntervalKm);
    }
  }

  return { nextDueDate, nextDueOdometer };
}
