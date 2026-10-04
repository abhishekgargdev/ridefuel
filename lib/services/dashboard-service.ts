import type {
  Bike,
  FuelLog,
  DailyReading,
  Expense,
  MaintenanceRecord,
  BikeCareRecord,
  ServiceRecord,
  DashboardSummary,
  DashboardChartsData,
  UpcomingCareItem,
} from '@/types';
import { calculateMileageStats } from './mileage-calculator';
import { calculateEstimatedRange } from './range-calculator';
import { calculateFuelAnalytics } from './fuel-calculator';
import { calculateExpenseAnalytics } from './expense-service';
import { calculateMaintenanceSummary } from './maintenance-service';
import { calculateBikeHealth } from './bike-health-calculator';

export interface DashboardData {
  summary: DashboardSummary;
  charts: DashboardChartsData;
  bike: Bike;
}

export function computeDashboardData(
  bike: Bike,
  fuelLogs: FuelLog[],
  readings: DailyReading[],
  expenses: Expense[],
  maintenanceRecords: MaintenanceRecord[],
  bikeCareRecords: BikeCareRecord[] = [],
  serviceRecords: ServiceRecord[] = []
): DashboardData {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  // 1. Current Odometer & Today's Distance
  let currentOdometer = bike.currentOdometer || bike.initialOdometer || 0;
  for (const r of readings) {
    if (r.odometer > currentOdometer) currentOdometer = r.odometer;
  }
  for (const f of fuelLogs) {
    if (f.odometer > currentOdometer) currentOdometer = f.odometer;
  }

  // Today's reading distance
  const todayReading = readings.find((r) => r.date === todayStr);
  let todaysDistance = todayReading?.distance || 0;

  if (!todayReading && readings.length >= 2) {
    // If no reading strictly today, check most recent reading's recorded daily distance
    todaysDistance = readings[0].distance || 0;
  }

  // 2. Mileage & Fuel Analytics
  const mileageStats = calculateMileageStats(fuelLogs, bike.expectedMileage);
  const fuelAnalytics = calculateFuelAnalytics(fuelLogs);
  const rangeEstimate = calculateEstimatedRange(bike, fuelLogs, readings);
  const expenseAnalytics = calculateExpenseAnalytics(expenses, fuelLogs);
  const maintenanceSummary = calculateMaintenanceSummary(maintenanceRecords, bike);

  // 3. Monthly Distance
  // Calculate distance travelled in current month using readings & fuel logs
  const monthReadings = readings.filter((r) => r.date.startsWith(currentMonthStr));
  let monthlyDistance = 0;
  if (monthReadings.length > 0) {
    monthlyDistance = monthReadings.reduce((sum, r) => sum + (r.distance || 0), 0);
  } else {
    // Estimate from recent logs in month
    const monthFuel = fuelLogs.filter((f) => f.date.startsWith(currentMonthStr));
    monthlyDistance = monthFuel.reduce((sum, f) => sum + (f.distanceSincePrevious || 0), 0);
    if (monthlyDistance === 0 && readings.length > 0) {
      // Calculate 30-day recent distance sum
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      const recentReadings = readings.filter((r) => r.date >= thirtyDaysAgo);
      monthlyDistance = recentReadings.reduce((sum, r) => sum + (r.distance || 0), 0);
    }
  }

  // 4. Monthly Fuel Cost
  const currentMonthFuelLogs = fuelLogs.filter((f) => f.date.startsWith(currentMonthStr));
  const monthlyFuelCost = currentMonthFuelLogs.reduce((sum, f) => sum + f.totalAmount, 0);

  // 5. Cost Per KM
  // Total fuel spend divided by total distance recorded across fuel refills
  const totalRefillDistance = mileageStats.totalDistanceCalculated;
  const costPerKm =
    totalRefillDistance > 0 && fuelAnalytics.totalCost > 0
      ? Number((fuelAnalytics.totalCost / totalRefillDistance).toFixed(2))
      : null;

  // 6. Last Fuel Fill
  const sortedLogs = [...fuelLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.odometer - a.odometer
  );
  const lastFill = sortedLogs.length > 0 ? sortedLogs[0] : null;
  const lastFuelFill = lastFill
    ? {
        date: lastFill.date,
        quantity: lastFill.fuelQuantity,
        odometer: lastFill.odometer,
        totalAmount: lastFill.totalAmount,
        pricePerLiter: lastFill.pricePerLiter,
        station: lastFill.fuelStation,
      }
    : null;

  // 7. Total Bike Expenditure
  // Combined lifetime financial expenditure: fuel refills + workshop/servicing + accessories + insurance etc.
  const totalBikeExpenditure = Number(expenseAnalytics.totalExpenseAmount.toFixed(2));
  const totalFuelExpenditure = Number(fuelAnalytics.totalCost.toFixed(2));
  const currentMonthFuelExpenditure = Number(monthlyFuelCost.toFixed(2));

  // 8. Health Score & Maintenance Indicators
  const healthScore = calculateBikeHealth(currentOdometer, bikeCareRecords, serviceRecords);

  // 9. Upcoming Care & Overdue tasks
  const upcomingCare: UpcomingCareItem[] = [];

  // Add from maintenanceRecords
  if (maintenanceSummary.nextMaintenance) {
    const nm = maintenanceSummary.nextMaintenance;
    upcomingCare.push({
      id: 'next_maint',
      category: nm.serviceType,
      type: 'service',
      dueDescription: nm.isOverdue
        ? `Overdue by ${Math.abs(nm.remainingKm || 0)} km`
        : nm.remainingKm !== undefined
        ? `Due in ${nm.remainingKm.toLocaleString()} km`
        : nm.daysRemaining !== undefined
        ? `Due in ${nm.daysRemaining} days`
        : 'Due soon',
      nextDueDate: nm.nextDueDate,
      nextDueOdometer: nm.nextDueOdometer,
      remainingKm: nm.remainingKm,
      remainingDays: nm.daysRemaining,
      isOverdue: nm.isOverdue,
      urgency: nm.isOverdue ? 'high' : 'medium',
      targetRoute: '/dashboard/maintenance',
    });
  }

  // Add health score items that are DUE, OVERDUE, or DUE SOON
  for (const item of healthScore.items) {
    if (item.status === 'OVERDUE' || item.status === 'DUE' || item.status === 'DUE SOON') {
      const isOverdue = item.status === 'OVERDUE';
      if (!upcomingCare.some((u) => u.category.toLowerCase() === item.name.toLowerCase())) {
        upcomingCare.push({
          id: `health_${item.name.toLowerCase().replace(/\s+/g, '_')}`,
          category: item.name,
          type: item.name.includes('Service') ? 'service' : 'bike_care',
          dueDescription: isOverdue
            ? `Overdue by ${item.remainingKm ? Math.abs(item.remainingKm) + ' km' : item.remainingDays ? Math.abs(item.remainingDays) + ' days' : 'scheduled cycle'}`
            : item.remainingKm !== undefined && item.remainingKm > 0
            ? `Due in ${item.remainingKm.toLocaleString()} km`
            : item.remainingDays !== undefined && item.remainingDays > 0
            ? `Due in ${item.remainingDays} days`
            : 'Due for inspection',
          nextDueDate: item.nextDueDate,
          nextDueOdometer: item.nextDueOdometer,
          remainingKm: item.remainingKm,
          remainingDays: item.remainingDays,
          isOverdue,
          urgency: isOverdue ? 'high' : item.status === 'DUE' ? 'medium' : 'low',
          targetRoute: item.name.includes('Service') ? '/dashboard/maintenance' : '/dashboard/maintenance',
        });
      }
    }
  }

  // Count overdue & upcoming
  const overdueTasksCount = upcomingCare.filter((u) => u.isOverdue).length + (maintenanceSummary.overdueCount > 0 && !upcomingCare.some((u) => u.isOverdue) ? maintenanceSummary.overdueCount : 0);
  const upcomingTasksCount = upcomingCare.length;

  // 10. Expenses Breakdown
  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthStr));
  const currentMonthTotalNonFuel = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthTotal = Number((currentMonthFuelExpenditure + currentMonthTotalNonFuel).toFixed(2));

  const maintenanceTotal = expenses
    .filter((e) => e.category === 'Maintenance' || e.category === 'Repair')
    .reduce((sum, e) => sum + e.amount, 0);

  const otherTotal = expenses
    .filter((e) => e.category !== 'Petrol' && e.category !== 'Maintenance' && e.category !== 'Repair')
    .reduce((sum, e) => sum + e.amount, 0);

  // 11. Today Stats
  const todayFuelConsumed = todaysDistance > 0 && mileageStats.averageMileage && mileageStats.averageMileage > 0
    ? Number((todaysDistance / mileageStats.averageMileage).toFixed(2))
    : 0;

  const todayEstimatedCost = todayFuelConsumed > 0
    ? Number((todayFuelConsumed * (fuelAnalytics.averagePricePerLiter || 96.5)).toFixed(2))
    : 0;

  // Summary object with all required KPIs
  const summary: DashboardSummary = {
    currentOdometer,
    todaysDistance,
    monthlyDistance,
    thisMonthsDistance: monthlyDistance,
    estimatedFuel: rangeEstimate.estimatedFuel,
    estimatedRange: rangeEstimate.estimatedRange,
    averageMileage: mileageStats.averageMileage,
    recentMileage: mileageStats.recentMileage,
    averageFuelPrice: fuelAnalytics.averagePricePerLiter || null,
    averagePetrolPrice: fuelAnalytics.averagePricePerLiter || null,
    totalFuelCost: totalFuelExpenditure,
    totalFuelExpenditure,
    monthlyFuelCost: currentMonthFuelExpenditure,
    currentMonthFuelExpenditure,
    totalBikeExpenditure,
    costPerKm,
    costPerKilometer: costPerKm,
    lastFuelFill,
    nextMaintenance: maintenanceSummary.nextMaintenance,
    healthScore,
    upcomingCare,
    overdueTasksCount,
    upcomingTasksCount,
    expenseBreakdown: {
      thisMonthTotal,
      fuelTotal: totalFuelExpenditure,
      maintenanceTotal,
      otherTotal,
    },
    todayStats: {
      distance: todaysDistance,
      fuelConsumed: todayFuelConsumed,
      estimatedCost: todayEstimatedCost,
    },
  };

  // 7. Assemble Chart Data
  // Mileage over time
  const mileageOverTime = mileageStats.logsWithMileage
    .map((l) => ({
      date: l.date,
      mileage: l.mileage,
      isFullTank: l.isFullTank,
      odometer: l.odometer,
    }))
    .reverse();

  // Monthly Distance
  const distanceByMonth: Record<string, number> = {};
  for (const r of readings) {
    const m = r.date.substring(0, 7);
    distanceByMonth[m] = (distanceByMonth[m] || 0) + (r.distance || 0);
  }
  let monthlyDistanceChart = Object.entries(distanceByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, distance]) => ({ month, distance }));

  // Fallback to fuel log distances if no daily readings entered yet
  if (monthlyDistanceChart.length === 0) {
    const fuelDistanceByMonth: Record<string, number> = {};
    for (const f of fuelLogs) {
      if (f.distanceSincePrevious && f.distanceSincePrevious > 0) {
        const m = f.date.substring(0, 7);
        fuelDistanceByMonth[m] = (fuelDistanceByMonth[m] || 0) + f.distanceSincePrevious;
      }
    }
    monthlyDistanceChart = Object.entries(fuelDistanceByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, distance]) => ({ month, distance }));
  }

  // Monthly Fuel Consumption
  const monthlyFuelConsumption = fuelAnalytics.monthlyConsumption.map((m) => ({
    month: m.month,
    liters: m.liters,
  }));

  // Monthly Fuel Expense
  const monthlyFuelExpense = fuelAnalytics.monthlyConsumption.map((m) => ({
    month: m.month,
    amount: m.amount,
  }));

  // Petrol Price Trend
  const petrolPriceTrend = fuelAnalytics.priceTrends;

  // Cost per KM trend
  const costPerKmTrend = mileageStats.logsWithMileage
    .filter((l) => l.costPerKm > 0)
    .map((l) => ({
      date: l.date,
      costPerKm: l.costPerKm,
    }))
    .reverse();

  // Maintenance Expenses grouped by month
  const maintenanceByMonth: Record<string, number> = {};
  for (const m of maintenanceRecords) {
    if (m.status !== 'upcoming' || m.amount > 0) {
      const month = m.date.substring(0, 7);
      maintenanceByMonth[month] = (maintenanceByMonth[month] || 0) + m.amount;
    }
  }
  const maintenanceExpenses = Object.entries(maintenanceByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month,
      amount: Number(amount.toFixed(2)),
    }));

  // Total Expenses By Category
  const totalExpensesByCategory = expenseAnalytics.expensesByCategory.map((c) => ({
    category: c.category,
    amount: c.amount,
    color: c.color,
  }));

  const charts: DashboardChartsData = {
    mileageOverTime,
    monthlyDistance: monthlyDistanceChart,
    monthlyFuelConsumption,
    monthlyFuelExpense,
    petrolPriceTrend,
    costPerKmTrend,
    maintenanceExpenses,
    totalExpensesByCategory,
  };

  return {
    summary,
    charts,
    bike,
  };
}
