import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { createBikeCareRuleSchema } from '@/lib/validations/bike-care-rule';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';
import { PREDEFINED_CARE_RULES } from '@/lib/services/maintenance-scheduler';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeId = searchParams.get('bikeId') || undefined;

    let rules = await Repository.getBikeCareRules(user.userId, bikeId);

    // If no custom rules found and bikeId provided, seed default rules
    if (rules.length === 0 && bikeId) {
      for (const def of PREDEFINED_CARE_RULES) {
        await Repository.upsertBikeCareRule(user.userId, {
          bikeId,
          category: def.category,
          defaultIntervalKm: def.defaultIntervalKm,
          defaultIntervalDays: def.defaultIntervalDays,
          intervalMode: def.intervalMode,
          enabled: true,
          notes: def.notes,
        });
      }
      rules = await Repository.getBikeCareRules(user.userId, bikeId);
    }

    return successResponse(rules);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const body = await req.json();
    const validated = createBikeCareRuleSchema.parse(body);

    const bike = await Repository.getBikeById(validated.bikeId, user.userId);
    if (!bike) {
      return errorResponse('Motorcycle not found or unauthorized', 404);
    }

    const saved = await Repository.upsertBikeCareRule(user.userId, validated);
    return successResponse(saved, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
