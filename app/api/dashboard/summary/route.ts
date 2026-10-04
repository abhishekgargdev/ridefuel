import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { computeDashboardData } from '@/lib/services/dashboard-service';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeIdParam = searchParams.get('bikeId');

    let activeBike = null;
    if (bikeIdParam) {
      activeBike = await Repository.getBikeById(bikeIdParam, user.userId);
    } else {
      activeBike = await Repository.getActiveBikeByUser(user.userId);
    }

    if (!activeBike) {
      return errorResponse('No motorcycle found. Please add a bike to get started.', 404);
    }

    const [fuelLogs, readings, expenses, maintenanceRecords, bikeCareRecords, serviceRecords] = await Promise.all([
      Repository.getFuelLogs(user.userId, activeBike.id),
      Repository.getDailyReadings(user.userId, activeBike.id),
      Repository.getExpenses(user.userId, activeBike.id),
      Repository.getMaintenanceRecords(user.userId, activeBike.id),
      Repository.getBikeCareRecords(user.userId, activeBike.id),
      Repository.getServiceRecords(user.userId, activeBike.id),
    ]);

    const dashboard = computeDashboardData(
      activeBike,
      fuelLogs,
      readings,
      expenses,
      maintenanceRecords,
      bikeCareRecords,
      serviceRecords
    );

    return successResponse({
      summary: dashboard.summary,
      bike: activeBike,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
