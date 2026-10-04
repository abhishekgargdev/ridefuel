import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { dailyReadingSchema } from '@/lib/validations/reading';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeId = searchParams.get('bikeId') || undefined;

    const readings = await Repository.getDailyReadings(user.userId, bikeId);
    return successResponse(readings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const body = await req.json();
    const validated = dailyReadingSchema.parse(body);

    const bike = await Repository.getBikeById(validated.bikeId, user.userId);
    if (!bike) {
      return errorResponse('Selected bike not found or unauthorized', 404);
    }

    // Get previous readings for this bike
    const existingReadings = await Repository.getDailyReadings(user.userId, validated.bikeId);
    let distance = 0;

    if (existingReadings.length > 0) {
      // Find the latest reading before this date or latest overall
      const latestReading = existingReadings[0];

      // Odometer validation: prevent decrease without explicit correction workflow
      if (validated.odometer < latestReading.odometer && !validated.allowCorrection) {
        return errorResponse(
          `New odometer (${validated.odometer} km) is lower than previous reading (${latestReading.odometer} km). If this is an intentional calibration or cluster replacement, enable "Odometer Correction Workflow".`,
          422
        );
      }

      distance = validated.odometer > latestReading.odometer ? validated.odometer - latestReading.odometer : 0;
    } else {
      // First reading: compare to bike's initial odometer
      distance = validated.odometer > bike.initialOdometer ? validated.odometer - bike.initialOdometer : 0;
    }

    const newReading = await Repository.createDailyReading(user.userId, {
      bikeId: validated.bikeId,
      date: validated.date,
      odometer: validated.odometer,
      distance,
      notes: validated.notes,
    });

    return successResponse(newReading, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
