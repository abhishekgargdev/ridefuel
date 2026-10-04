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
    const timeRange = searchParams.get('timeRange') || '30d';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let activeBike = null;
    if (bikeIdParam) {
      activeBike = await Repository.getBikeById(bikeIdParam, user.userId);
    } else {
      activeBike = await Repository.getActiveBikeByUser(user.userId);
    }

    if (!activeBike) {
      return errorResponse('No motorcycle found.', 404);
    }

    let [fuelLogs, readings, expenses, maintenanceRecords] = await Promise.all([
      Repository.getFuelLogs(user.userId, activeBike.id),
      Repository.getDailyReadings(user.userId, activeBike.id),
      Repository.getExpenses(user.userId, activeBike.id),
      Repository.getMaintenanceRecords(user.userId, activeBike.id),
    ]);

    // Apply date range filter
    const now = new Date();
    let filterStartDate: string | null = null;
    let filterEndDate: string | null = null;

    if (timeRange === '7d') {
      filterStartDate = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    } else if (timeRange === '30d') {
      filterStartDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    } else if (timeRange === '3m') {
      filterStartDate = new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0];
    } else if (timeRange === '6m') {
      filterStartDate = new Date(now.getTime() - 180 * 86400000).toISOString().split('T')[0];
    } else if (timeRange === '1y') {
      filterStartDate = new Date(now.getTime() - 365 * 86400000).toISOString().split('T')[0];
    } else if (timeRange === 'custom' && startDateParam) {
      filterStartDate = startDateParam;
      filterEndDate = endDateParam || null;
    }

    if (filterStartDate) {
      fuelLogs = fuelLogs.filter((f) => f.date >= filterStartDate! && (!filterEndDate || f.date <= filterEndDate));
      readings = readings.filter((r) => r.date >= filterStartDate! && (!filterEndDate || r.date <= filterEndDate));
      expenses = expenses.filter((e) => e.date >= filterStartDate! && (!filterEndDate || e.date <= filterEndDate));
      maintenanceRecords = maintenanceRecords.filter((m) => m.date >= filterStartDate! && (!filterEndDate || m.date <= filterEndDate));
    }

    const dashboard = computeDashboardData(
      activeBike,
      fuelLogs,
      readings,
      expenses,
      maintenanceRecords
    );

    return successResponse({
      charts: dashboard.charts,
      filters: { timeRange, startDate: filterStartDate, endDate: filterEndDate },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
