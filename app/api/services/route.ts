import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { createServiceSchema } from '@/lib/validations/service';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeId = searchParams.get('bikeId') || undefined;

    const services = await Repository.getServiceRecords(user.userId, bikeId);
    return successResponse(services);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const body = await req.json();
    const validated = createServiceSchema.parse(body);

    const bike = await Repository.getBikeById(validated.bikeId, user.userId);
    if (!bike) {
      return errorResponse('Motorcycle not found or unauthorized', 404);
    }

    const created = await Repository.createServiceRecord(user.userId, validated);
    return successResponse(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
