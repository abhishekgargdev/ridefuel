import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { updateBikeSchema } from '@/lib/validations/bike';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const bike = await Repository.getBikeById(id, user.userId);
    if (!bike) {
      return errorResponse('Bike not found', 404);
    }
    return successResponse(bike);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const body = await req.json();
    const validated = updateBikeSchema.parse(body);

    const updated = await Repository.updateBike(id, user.userId, validated);
    if (!updated) {
      return errorResponse('Bike not found or unauthorized', 404);
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
    const success = await Repository.deleteBike(id, user.userId);
    if (!success) {
      return errorResponse('Bike not found or unauthorized', 404);
    }
    return successResponse({ message: 'Bike deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
