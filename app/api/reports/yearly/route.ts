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
      bike = await Repository.getActiveBikeByUser(user.userId);
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

    const yearsMap: Record<
      string,
      {
        year: string;
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

    for (const r of readings) {
      const y = r.date.substring(0, 4);
      if (!yearsMap[y]) {
        yearsMap[y] = {
          year: y,
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
      yearsMap[y].distance += r.distance || 0;
    }

    for (const f of fuelLogs) {
      const y = f.date.substring(0, 4);
      if (!yearsMap[y]) {
        yearsMap[y] = {
          year: y,
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
      yearsMap[y].fuelLiters += f.fuelQuantity;
      yearsMap[y].fuelCost += f.totalAmount;
      yearsMap[y].totalCost += f.totalAmount;
      yearsMap[y].refillCount += 1;
    }

    for (const s of maintenance) {
      if (s.status === 'completed') {
        const y = s.date.substring(0, 4);
        if (!yearsMap[y]) {
          yearsMap[y] = {
            year: y,
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
        yearsMap[y].maintenanceCost += s.amount;
        yearsMap[y].totalCost += s.amount;
      }
    }

    for (const e of expenses) {
      if (e.category !== 'Petrol' && e.category !== 'Maintenance' && e.category !== 'Repair') {
        const y = e.date.substring(0, 4);
        if (!yearsMap[y]) {
          yearsMap[y] = {
            year: y,
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
        yearsMap[y].otherExpenses += e.amount;
        yearsMap[y].totalCost += e.amount;
      }
    }

    const reports = Object.values(yearsMap)
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
      .sort((a, b) => b.year.localeCompare(a.year));

    return successResponse({
      bike,
      reports,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
