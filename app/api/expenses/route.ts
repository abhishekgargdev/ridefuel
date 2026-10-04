import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { expenseSchema } from '@/lib/validations/expense';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const { searchParams } = new URL(req.url);
    const bikeId = searchParams.get('bikeId') || undefined;

    const expenses = await Repository.getExpenses(user.userId, bikeId);
    return successResponse(expenses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthUser(req);
    const body = await req.json();
    const validated = expenseSchema.parse(body);

    const bike = await Repository.getBikeById(validated.bikeId, user.userId);
    if (!bike) {
      return errorResponse('Selected bike not found or unauthorized', 404);
    }

    const newExpense = await Repository.createExpense(user.userId, validated);
    return successResponse(newExpense, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
