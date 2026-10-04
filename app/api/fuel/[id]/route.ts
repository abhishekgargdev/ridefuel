import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { updateFuelLogSchema } from '@/lib/validations/fuel';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const log = await Repository.getFuelLogById(id, user.userId);
    if (!log) {
      return errorResponse('Fuel log not found', 404);
    }
    return successResponse(log);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const body = await req.json();
    const validated = updateFuelLogSchema.parse(body);

    const updated = await Repository.updateFuelLog(id, user.userId, validated);
    if (!updated) {
      return errorResponse('Fuel log not found or unauthorized', 404);
    }
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const success = await Repository.deleteFuelLog(id, user.userId);
    if (!success) {
      return errorResponse('Fuel log not found or unauthorized', 404);
    }
    return successResponse({ message: 'Fuel log deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
