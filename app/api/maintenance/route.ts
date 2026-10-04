import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { maintenanceRecordSchema } from '@/lib/validations/maintenance';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeId = searchParams.get('bikeId') || undefined;

    const records = await Repository.getMaintenanceRecords(user.userId, bikeId);
    return successResponse(records);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const body = await req.json();
    const validated = maintenanceRecordSchema.parse(body);

    const bike = await Repository.getBikeById(validated.bikeId, user.userId);
    if (!bike) {
      return errorResponse('Selected bike not found or unauthorized', 404);
    }

    const newRecord = await Repository.createMaintenanceRecord(user.userId, validated);
    return successResponse(newRecord, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
