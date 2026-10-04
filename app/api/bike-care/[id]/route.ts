import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { updateBikeCareSchema } from '@/lib/validations/bike-care';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await params;

    const record = await Repository.getBikeCareRecordById(user.userId, id);
    if (!record) {
      return errorResponse('Bike care record not found', 404);
    }

    return successResponse(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await params;
    const body = await req.json();
    const validated = updateBikeCareSchema.parse(body);

    const updated = await Repository.updateBikeCareRecord(user.userId, id, validated);
    if (!updated) {
      return errorResponse('Bike care record not found or unauthorized', 404);
    }

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await params;

    const deleted = await Repository.deleteBikeCareRecord(user.userId, id);
    if (!deleted) {
      return errorResponse('Bike care record not found or unauthorized', 404);
    }

    return successResponse({ deleted: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
