import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { fuelLogSchema } from '@/lib/validations/fuel';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeId = searchParams.get('bikeId') || undefined;

    const logs = await Repository.getFuelLogs(user.userId, bikeId);
    return successResponse(logs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const body = await req.json();
    const validated = fuelLogSchema.parse(body);

    // Verify bike ownership
    const bike = await Repository.getBikeById(validated.bikeId, user.userId);
    if (!bike) {
      return errorResponse('Selected bike not found or unauthorized', 404);
    }

    // Get previous fuel logs for this bike to calculate distance, mileage, and cost/km
    const previousLogs = await Repository.getFuelLogs(user.userId, validated.bikeId);
    let distanceSincePrevious: number | null = null;
    let estimatedMileage: number | null = null;
    let costPerKm: number | null = null;

    if (previousLogs.length > 0) {
      // Find the closest previous log by odometer
      const earlierLogs = previousLogs.filter((l) => l.odometer < validated.odometer);
      if (earlierLogs.length > 0) {
        const lastLog = earlierLogs[0]; // sorted descending
        distanceSincePrevious = validated.odometer - lastLog.odometer;

        // If this is a full tank refill and previous was full tank: calculate mileage!
        if (validated.isFullTank && lastLog.isFullTank && distanceSincePrevious > 0 && validated.fuelQuantity > 0) {
          estimatedMileage = Number((distanceSincePrevious / validated.fuelQuantity).toFixed(2));
        }

        if (distanceSincePrevious > 0 && validated.totalAmount > 0) {
          costPerKm = Number((validated.totalAmount / distanceSincePrevious).toFixed(2));
        }
      }
    }

    const newLog = await Repository.createFuelLog(user.userId, {
      ...validated,
      distanceSincePrevious,
      estimatedMileage,
      costPerKm,
    });

    return successResponse(newLog, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
