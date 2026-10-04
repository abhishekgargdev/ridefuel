import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { createBikeCareSchema } from '@/lib/validations/bike-care';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';
import { calculateNextDue } from '@/lib/services/maintenance-scheduler';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeId = searchParams.get('bikeId') || undefined;
    const category = searchParams.get('category') || undefined;

    const records = await Repository.getBikeCareRecords(user.userId, bikeId, category);
    return successResponse(records);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const body = await req.json();
    const validated = createBikeCareSchema.parse(body);

    const bike = await Repository.getBikeById(validated.bikeId, user.userId);
    if (!bike) {
      return errorResponse('Motorcycle not found or unauthorized', 404);
    }

    // Auto-calculate nextDueDate or nextDueOdometer from rules if not provided
    let nextDueDate = validated.nextDueDate || undefined;
    let nextDueOdometer = validated.nextDueOdometer || undefined;

    if (!nextDueDate && !nextDueOdometer) {
      const rule = await Repository.getBikeCareRuleByCategory(user.userId, validated.bikeId, validated.category);
      if (rule && rule.enabled) {
        const computed = calculateNextDue(validated.performedAt, validated.performedAtOdometer, rule);
        if (!nextDueDate) nextDueDate = computed.nextDueDate;
        if (!nextDueOdometer) nextDueOdometer = computed.nextDueOdometer;
      }
    }

    const created = await Repository.createBikeCareRecord(user.userId, {
      ...validated,
      nextDueDate,
      nextDueOdometer,
    });

    return successResponse(created, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
