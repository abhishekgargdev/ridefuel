import type { MaintenanceRecord, Bike } from '@/types';

export interface MaintenanceStatusSummary {
  totalCost: number;
  completedCount: number;
  upcomingCount: number;
  overdueCount: number;
  upcomingList: MaintenanceRecord[];
  overdueList: MaintenanceRecord[];
  completedList: MaintenanceRecord[];
  nextMaintenance: {
    serviceType: string;
    nextDueDate?: string;
    nextDueOdometer?: number;
    remainingKm?: number;
    daysRemaining?: number;
    isOverdue: boolean;
  } | null;
}

export function calculateMaintenanceSummary(
  records: MaintenanceRecord[],
  bike: Bike
): MaintenanceStatusSummary {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentOdometer = bike.currentOdometer || 0;

  let totalCost = 0;
  let completedCount = 0;
  const upcomingList: MaintenanceRecord[] = [];
  const overdueList: MaintenanceRecord[] = [];
  const completedList: MaintenanceRecord[] = [];

  for (const record of records) {
    if (record.status === 'completed') {
      completedCount++;
      totalCost += record.amount || 0;
      completedList.push(record);
    }

    // Check if record has upcoming due date or odometer
    if (record.nextDueDate || record.nextDueOdometer) {
      let isOverdue = false;

      if (record.nextDueDate && record.nextDueDate < todayStr) {
        isOverdue = true;
      }
      if (record.nextDueOdometer && record.nextDueOdometer <= currentOdometer) {
        isOverdue = true;
      }

      if (isOverdue) {
        overdueList.push(record);
      } else {
        upcomingList.push(record);
      }
    }
  }

  // Sort upcoming by closest date or closest odometer
  upcomingList.sort((a, b) => {
    if (a.nextDueDate && b.nextDueDate) {
      return a.nextDueDate.localeCompare(b.nextDueDate);
    }
    if (a.nextDueOdometer && b.nextDueOdometer) {
      return a.nextDueOdometer - b.nextDueOdometer;
    }
    return 0;
  });

  // Determine next upcoming or overdue service
  let nextMaintenance: MaintenanceStatusSummary['nextMaintenance'] = null;

  if (overdueList.length > 0) {
    const firstOverdue = overdueList[0];
    const remainingKm = firstOverdue.nextDueOdometer ? firstOverdue.nextDueOdometer - currentOdometer : undefined;
    const daysRemaining = firstOverdue.nextDueDate
      ? Math.ceil((new Date(firstOverdue.nextDueDate).getTime() - now.getTime()) / (1000 * 3600 * 24))
      : undefined;

    nextMaintenance = {
      serviceType: firstOverdue.serviceType,
      nextDueDate: firstOverdue.nextDueDate,
      nextDueOdometer: firstOverdue.nextDueOdometer,
      remainingKm,
      daysRemaining,
      isOverdue: true,
    };
  } else if (upcomingList.length > 0) {
    const firstUpcoming = upcomingList[0];
    const remainingKm = firstUpcoming.nextDueOdometer ? firstUpcoming.nextDueOdometer - currentOdometer : undefined;
    const daysRemaining = firstUpcoming.nextDueDate
      ? Math.ceil((new Date(firstUpcoming.nextDueDate).getTime() - now.getTime()) / (1000 * 3600 * 24))
      : undefined;

    nextMaintenance = {
      serviceType: firstUpcoming.serviceType,
      nextDueDate: firstUpcoming.nextDueDate,
      nextDueOdometer: firstUpcoming.nextDueOdometer,
      remainingKm,
      daysRemaining,
      isOverdue: false,
    };
  }

  return {
    totalCost: Number(totalCost.toFixed(2)),
    completedCount,
    upcomingCount: upcomingList.length,
    overdueCount: overdueList.length,
    upcomingList,
    overdueList,
    completedList,
    nextMaintenance,
  };
}
