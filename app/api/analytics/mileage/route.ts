import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { calculateMileageStats } from '@/lib/services/mileage-calculator';
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

    const fuelLogs = await Repository.getFuelLogs(user.userId, bike.id);
    const stats = calculateMileageStats(fuelLogs, bike.expectedMileage);

    return successResponse({
      bike,
      stats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
