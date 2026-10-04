import { NextRequest } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { updateExpenseSchema } from '@/lib/validations/expense';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const expense = await Repository.getExpenseById(id, user.userId);
    if (!expense) {
      return errorResponse('Expense not found', 404);
    }
    return successResponse(expense);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { user } = await requireAuthUser(req);
    const { id } = await context.params;
    const body = await req.json();
    const validated = updateExpenseSchema.parse(body);

    const updated = await Repository.updateExpense(id, user.userId, validated);
    if (!updated) {
      return errorResponse('Expense not found or unauthorized', 404);
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
    const success = await Repository.deleteExpense(id, user.userId);
    if (!success) {
      return errorResponse('Expense not found or unauthorized', 404);
    }
    return successResponse({ message: 'Expense deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
