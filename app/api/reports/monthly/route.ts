import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeId = searchParams.get('bikeId') || undefined;

    let bike = null;
    if (bikeId) {
      bike = await Repository.getBikeById(bikeId, user.userId);
    } else {
      activeBike: bike = await Repository.getActiveBikeByUser(user.userId);
    }

    if (!bike) {
      return errorResponse('Motorcycle not found', 404);
    }

    const [fuelLogs, readings, expenses, maintenance] = await Promise.all([
      Repository.getFuelLogs(user.userId, bike.id),
      Repository.getDailyReadings(user.userId, bike.id),
      Repository.getExpenses(user.userId, bike.id),
      Repository.getMaintenanceRecords(user.userId, bike.id),
    ]);

    // Aggregate monthly report
    const monthsMap: Record<
      string,
      {
        month: string;
        distance: number;
        fuelLiters: number;
        fuelCost: number;
        maintenanceCost: number;
        otherExpenses: number;
        totalCost: number;
        refillCount: number;
        costPerKm: number | null;
      }
    > = {};

    // 1. Readings distance
    for (const r of readings) {
      const m = r.date.substring(0, 7);
      if (!monthsMap[m]) {
        monthsMap[m] = {
          month: m,
          distance: 0,
          fuelLiters: 0,
          fuelCost: 0,
          maintenanceCost: 0,
          otherExpenses: 0,
          totalCost: 0,
          refillCount: 0,
          costPerKm: null,
        };
      }
      monthsMap[m].distance += r.distance || 0;
    }

    // 2. Fuel
    for (const f of fuelLogs) {
      const m = f.date.substring(0, 7);
      if (!monthsMap[m]) {
        monthsMap[m] = {
          month: m,
          distance: 0,
          fuelLiters: 0,
          fuelCost: 0,
          maintenanceCost: 0,
          otherExpenses: 0,
          totalCost: 0,
          refillCount: 0,
          costPerKm: null,
        };
      }
      monthsMap[m].fuelLiters += f.fuelQuantity;
      monthsMap[m].fuelCost += f.totalAmount;
      monthsMap[m].totalCost += f.totalAmount;
      monthsMap[m].refillCount += 1;
    }

    // 3. Maintenance
    for (const s of maintenance) {
      if (s.status === 'completed') {
        const m = s.date.substring(0, 7);
        if (!monthsMap[m]) {
          monthsMap[m] = {
            month: m,
            distance: 0,
            fuelLiters: 0,
            fuelCost: 0,
            maintenanceCost: 0,
            otherExpenses: 0,
            totalCost: 0,
            refillCount: 0,
            costPerKm: null,
          };
        }
        monthsMap[m].maintenanceCost += s.amount;
        monthsMap[m].totalCost += s.amount;
      }
    }

    // 4. Other Expenses
    for (const e of expenses) {
      if (e.category !== 'Petrol' && e.category !== 'Maintenance' && e.category !== 'Repair') {
        const m = e.date.substring(0, 7);
        if (!monthsMap[m]) {
          monthsMap[m] = {
            month: m,
            distance: 0,
            fuelLiters: 0,
            fuelCost: 0,
            maintenanceCost: 0,
            otherExpenses: 0,
            totalCost: 0,
            refillCount: 0,
            costPerKm: null,
          };
        }
        monthsMap[m].otherExpenses += e.amount;
        monthsMap[m].totalCost += e.amount;
      }
    }

    // Finalize cost per km
    const reports = Object.values(monthsMap)
      .map((entry) => ({
        ...entry,
        distance: Math.round(entry.distance),
        fuelLiters: Number(entry.fuelLiters.toFixed(1)),
        fuelCost: Number(entry.fuelCost.toFixed(2)),
        maintenanceCost: Number(entry.maintenanceCost.toFixed(2)),
        otherExpenses: Number(entry.otherExpenses.toFixed(2)),
        totalCost: Number(entry.totalCost.toFixed(2)),
        costPerKm:
          entry.distance > 0 ? Number((entry.totalCost / entry.distance).toFixed(2)) : null,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return successResponse({
      bike,
      reports,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
