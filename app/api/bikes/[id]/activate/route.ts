import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const bike = await Repository.setActiveBike(id, user.userId);
    if (!bike) {
      return errorResponse('Bike not found or unauthorized', 404);
    }
    return successResponse(bike);
  } catch (error) {
    return handleApiError(error);
  }
}
