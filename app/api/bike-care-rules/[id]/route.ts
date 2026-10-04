import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { updateBikeCareRuleSchema } from '@/lib/validations/bike-care-rule';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await params;
    const body = await req.json();
    const validated = updateBikeCareRuleSchema.parse(body);

    const rules = await Repository.getBikeCareRules(user.userId);
    const existing = rules.find((r) => r.id === id || r._id === id);
    if (!existing) {
      return errorResponse('Rule not found or unauthorized', 404);
    }

    const updated = await Repository.upsertBikeCareRule(user.userId, {
      ...existing,
      ...validated,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await params;

    const deleted = await Repository.deleteBikeCareRule(user.userId, id);
    if (!deleted) {
      return errorResponse('Rule not found or unauthorized', 404);
    }

    return successResponse({ deleted: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
