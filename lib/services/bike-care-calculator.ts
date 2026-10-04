/**
 * Bike Care Calculator
 * Calculations for next due date, next due odometer, remaining distance/days, and care status.
 */

export function getNextDueDate(performedAt: string, daysInterval?: number): string | undefined {
  if (!daysInterval || daysInterval <= 0) return undefined;
  const base = new Date(performedAt);
  if (isNaN(base.getTime())) return undefined;
  const next = new Date(base.getTime() + daysInterval * 24 * 60 * 60 * 1000);
  return next.toISOString().split('T')[0];
}

export function getNextDueOdometer(performedAtOdo: number, kmInterval?: number): number | undefined {
  if (!kmInterval || kmInterval <= 0) return undefined;
  return performedAtOdo + kmInterval;
}

export function getDaysRemaining(nextDueDate?: string): number | undefined {
  if (!nextDueDate) return undefined;
  const target = new Date(nextDueDate);
  if (isNaN(target.getTime())) return undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getKmRemaining(currentOdo: number, nextDueOdometer?: number): number | undefined {
  if (typeof nextDueOdometer !== 'number') return undefined;
  return nextDueOdometer - currentOdo;
}

export function getCareStatus(
  currentOdo: number,
  nextDueOdometer?: number,
  nextDueDate?: string
): 'completed' | 'upcoming' | 'due' | 'overdue' {
  const kmRem = getKmRemaining(currentOdo, nextDueOdometer);
  const daysRem = getDaysRemaining(nextDueDate);

  // Overdue check
  if (kmRem !== undefined && kmRem < 0) return 'overdue';
  if (daysRem !== undefined && daysRem < 0) return 'overdue';

  // Due check (Due today or within 50 km / 0 days)
  if (kmRem !== undefined && kmRem <= 50) return 'due';
  if (daysRem !== undefined && daysRem <= 0) return 'due';

  // Upcoming
  return 'upcoming';
}
