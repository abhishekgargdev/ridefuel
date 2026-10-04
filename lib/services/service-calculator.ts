/**
 * Service Calculator & Upcoming Care Aggregator
 * Calculates service totals, items breakdown, next service intervals, and upcoming care priorities.
 */

import { BikeCareRecord, ServiceRecord, UpcomingCareItem } from '@/types';
import { getDaysRemaining, getKmRemaining } from './bike-care-calculator';

export function calculateServiceCost(
  items: { totalPrice: number }[],
  labourCost = 0,
  otherCost = 0
): { partsCost: number; labourCost: number; otherCost: number; totalCost: number } {
  const partsCost = items.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  const totalCost = partsCost + (labourCost || 0) + (otherCost || 0);
  return { partsCost, labourCost, otherCost, totalCost };
}

export function getUpcomingCare(
  currentOdometer: number,
  careRecords: BikeCareRecord[],
  serviceRecords: ServiceRecord[],
  limit = 5
): UpcomingCareItem[] {
  const candidates: UpcomingCareItem[] = [];

  // Group latest care by category
  const latestCareByCategory = new Map<string, BikeCareRecord>();
  for (const record of careRecords) {
    const existing = latestCareByCategory.get(record.category);
    if (!existing || new Date(record.performedAt).getTime() > new Date(existing.performedAt).getTime()) {
      latestCareByCategory.set(record.category, record);
    }
  }

  for (const [category, record] of latestCareByCategory.entries()) {
    if (!record.nextDueDate && !record.nextDueOdometer) continue;

    const kmRem = getKmRemaining(currentOdometer, record.nextDueOdometer);
    const daysRem = getDaysRemaining(record.nextDueDate);

    let dueDesc = '';
    let isOverdue = false;
    let urgency: 'high' | 'medium' | 'low' = 'low';

    if (kmRem !== undefined && kmRem < 0) {
      dueDesc = `Overdue by ${Math.abs(kmRem)} km`;
      isOverdue = true;
      urgency = 'high';
    } else if (daysRem !== undefined && daysRem < 0) {
      dueDesc = `Overdue by ${Math.abs(daysRem)} days`;
      isOverdue = true;
      urgency = 'high';
    } else if (kmRem !== undefined && daysRem !== undefined) {
      if (kmRem <= 100 || daysRem <= 3) {
        dueDesc = kmRem <= 100 ? `Due in ${kmRem} km` : `Due in ${daysRem} days`;
        urgency = 'high';
      } else {
        dueDesc = kmRem < 500 ? `Due in ${kmRem} km` : `Due in ${daysRem} days`;
        urgency = kmRem <= 300 ? 'medium' : 'low';
      }
    } else if (kmRem !== undefined) {
      dueDesc = `Due in ${kmRem} km`;
      urgency = kmRem <= 100 ? 'high' : kmRem <= 300 ? 'medium' : 'low';
    } else if (daysRem !== undefined) {
      dueDesc = `Due in ${daysRem} days`;
      urgency = daysRem <= 3 ? 'high' : daysRem <= 14 ? 'medium' : 'low';
    }

    candidates.push({
      id: record.id,
      category,
      type: 'bike_care',
      dueDescription: dueDesc,
      nextDueDate: record.nextDueDate,
      nextDueOdometer: record.nextDueOdometer,
      remainingKm: kmRem,
      remainingDays: daysRem,
      isOverdue,
      urgency,
      targetRoute: `/dashboard/bike-care/${record.id}`,
    });
  }

  // Check latest service record
  const latestService = [...serviceRecords].sort(
    (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
  )[0];

  if (latestService && (latestService.nextServiceDate || latestService.nextServiceOdometer)) {
    const kmRem = getKmRemaining(currentOdometer, latestService.nextServiceOdometer);
    const daysRem = getDaysRemaining(latestService.nextServiceDate);

    let dueDesc = '';
    let isOverdue = false;
    let urgency: 'high' | 'medium' | 'low' = 'low';

    if (kmRem !== undefined && kmRem < 0) {
      dueDesc = `Overdue by ${Math.abs(kmRem)} km`;
      isOverdue = true;
      urgency = 'high';
    } else if (daysRem !== undefined && daysRem < 0) {
      dueDesc = `Overdue by ${Math.abs(daysRem)} days`;
      isOverdue = true;
      urgency = 'high';
    } else if (kmRem !== undefined && daysRem !== undefined) {
      dueDesc = kmRem < 500 ? `Due in ${kmRem} km` : `Due in ${daysRem} days`;
      urgency = kmRem <= 500 || daysRem <= 14 ? 'high' : 'medium';
    } else if (kmRem !== undefined) {
      dueDesc = `Due in ${kmRem} km`;
      urgency = kmRem <= 500 ? 'high' : 'medium';
    } else if (daysRem !== undefined) {
      dueDesc = `Due in ${daysRem} days`;
      urgency = daysRem <= 14 ? 'high' : 'medium';
    }

    candidates.push({
      id: latestService.id,
      category: 'General Service',
      type: 'service',
      dueDescription: dueDesc,
      nextDueDate: latestService.nextServiceDate,
      nextDueOdometer: latestService.nextServiceOdometer,
      remainingKm: kmRem,
      remainingDays: daysRem,
      isOverdue,
      urgency,
      targetRoute: `/dashboard/services/${latestService.id}`,
    });
  }

  // Sort by urgency: overdue first, then by remaining km or days
  candidates.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;

    const aDist = a.remainingKm !== undefined ? a.remainingKm : (a.remainingDays || 9999) * 20;
    const bDist = b.remainingKm !== undefined ? b.remainingKm : (b.remainingDays || 9999) * 20;
    return aDist - bDist;
  });

  return candidates.slice(0, limit);
}
