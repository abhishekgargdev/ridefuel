import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { bikeSchema } from '@/lib/validations/bike';
import { Repository } from '@/lib/db/repository';
import { successResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const bikes = await Repository.getBikesByUser(user.userId);
    return successResponse(bikes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const body = await req.json();
    const validated = bikeSchema.parse(body);

    const newBike = await Repository.createBike(user.userId, validated);
    return successResponse(newBike, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
