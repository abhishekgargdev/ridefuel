/**
 * Bike Health Calculator & Maintenance Health Score
 * Calculates health items and score (0-100) based on logging telemetry.
 * Explicitly labeled as a tracking indicator, not a mechanical safety certification.
 */

import { BikeCareRecord, BikeHealthItem, BikeHealthScore, HealthStatusLevel, ServiceRecord } from '@/types';
import { getDaysRemaining, getKmRemaining } from './bike-care-calculator';

export const HEALTH_CATEGORIES = [
  'Engine Oil',
  'Chain Lubrication',
  'Chain Cleaning',
  'Bike Wash',
  'Brake Inspection',
  'Tyres',
  'Battery',
  'Air Filter',
  'General Service',
];

export function calculateBikeHealth(
  currentOdometer: number,
  careRecords: BikeCareRecord[],
  serviceRecords: ServiceRecord[]
): BikeHealthScore {
  const items: BikeHealthItem[] = HEALTH_CATEGORIES.map((catName) => {
    // Find latest completed bike care record for this category
    const relevantCare = careRecords
      .filter((r) => r.category.toLowerCase().includes(catName.toLowerCase()) || (catName === 'Tyres' && r.category.toLowerCase().includes('tyre')))
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())[0];

    // Check service records for General Service or engine oil
    const relevantService = serviceRecords
      .filter((s) => catName === 'General Service' || s.items.some((i) => i.itemName.toLowerCase().includes(catName.toLowerCase())))
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())[0];

    let lastDoneDate: string | undefined;
    let lastDoneOdometer: number | undefined;
    let nextDueDate: string | undefined;
    let nextDueOdometer: number | undefined;

    if (relevantCare) {
      lastDoneDate = relevantCare.performedAt;
      lastDoneOdometer = relevantCare.performedAtOdometer;
      nextDueDate = relevantCare.nextDueDate;
      nextDueOdometer = relevantCare.nextDueOdometer;
    } else if (relevantService) {
      lastDoneDate = relevantService.serviceDate;
      lastDoneOdometer = relevantService.odometer;
      nextDueDate = relevantService.nextServiceDate;
      nextDueOdometer = relevantService.nextServiceOdometer;
    }

    if (!lastDoneDate && !lastDoneOdometer) {
      return {
        name: catName,
        status: 'NO DATA' as HealthStatusLevel,
        notes: 'No service or care event recorded yet',
      };
    }

    const kmRem = getKmRemaining(currentOdometer, nextDueOdometer);
    const daysRem = getDaysRemaining(nextDueDate);

    let status: HealthStatusLevel = 'OK';

    if ((kmRem !== undefined && kmRem < 0) || (daysRem !== undefined && daysRem < 0)) {
      status = 'OVERDUE';
    } else if ((kmRem !== undefined && kmRem <= 50) || (daysRem !== undefined && daysRem <= 0)) {
      status = 'DUE';
    } else if ((kmRem !== undefined && kmRem <= 300) || (daysRem !== undefined && daysRem <= 7)) {
      status = 'DUE SOON';
    } else {
      status = 'OK';
    }

    return {
      name: catName,
      status,
      lastDoneDate,
      lastDoneOdometer,
      nextDueDate,
      nextDueOdometer,
      remainingKm: kmRem,
      remainingDays: daysRem,
    };
  });

  // Calculate composite score (100 base)
  // Deductions:
  // OVERDUE: -18 pts each
  // DUE: -10 pts each
  // DUE SOON: -4 pts each
  // NO DATA: -6 pts each
  let score = 100;
  for (const item of items) {
    if (item.status === 'OVERDUE') score -= 18;
    else if (item.status === 'DUE') score -= 10;
    else if (item.status === 'DUE SOON') score -= 4;
    else if (item.status === 'NO DATA') score -= 6;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade: BikeHealthScore['grade'] = 'EXCELLENT';
  if (score >= 90) grade = 'EXCELLENT';
  else if (score >= 75) grade = 'GOOD';
  else if (score >= 60) grade = 'FAIR';
  else if (score >= 40) grade = 'ATTENTION_NEEDED';
  else grade = 'CRITICAL';

  let summary = 'Motorcycle is in prime condition. All maintenance intervals are well maintained.';
  if (grade === 'GOOD') {
    summary = 'Motorcycle is well maintained with upcoming routine care scheduled.';
  } else if (grade === 'FAIR') {
    summary = 'Routine maintenance items are approaching due threshold.';
  } else if (grade === 'ATTENTION_NEEDED') {
    summary = 'Immediate attention recommended for due and overdue maintenance tasks.';
  } else if (grade === 'CRITICAL') {
    summary = 'Multiple critical maintenance cycles are overdue. Service immediately.';
  }

  const explanation =
    'The Maintenance Health Score evaluates recent oil changes, chain lubrication, brake condition, and service intervals against manufacturer maintenance schedules. It is a digital logging indicator and not a mechanical safety certification.';

  return {
    score,
    grade,
    summary,
    explanation,
    items,
    calculatedAt: new Date().toISOString(),
  };
}
