import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { updateMaintenanceRecordSchema } from '@/lib/validations/maintenance';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const record = await Repository.getMaintenanceRecordById(id, user.userId);
    if (!record) {
      return errorResponse('Maintenance record not found', 404);
    }
    return successResponse(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const body = await req.json();
    const validated = updateMaintenanceRecordSchema.parse(body);

    const updated = await Repository.updateMaintenanceRecord(id, user.userId, validated);
    if (!updated) {
      return errorResponse('Maintenance record not found or unauthorized', 404);
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
    const success = await Repository.deleteMaintenanceRecord(id, user.userId);
    if (!success) {
      return errorResponse('Maintenance record not found or unauthorized', 404);
    }
    return successResponse({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
