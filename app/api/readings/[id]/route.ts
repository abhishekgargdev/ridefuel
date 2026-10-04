import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { updateDailyReadingSchema } from '@/lib/validations/reading';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const reading = await Repository.getDailyReadingById(id, user.userId);
    if (!reading) {
      return errorResponse('Daily reading not found', 404);
    }
    return successResponse(reading);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const body = await req.json();
    const validated = updateDailyReadingSchema.parse(body);

    const updated = await Repository.updateDailyReading(id, user.userId, validated);
    if (!updated) {
      return errorResponse('Daily reading not found or unauthorized', 404);
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
    const success = await Repository.deleteDailyReading(id, user.userId);
    if (!success) {
      return errorResponse('Daily reading not found or unauthorized', 404);
    }
    return successResponse({ message: 'Daily reading deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
