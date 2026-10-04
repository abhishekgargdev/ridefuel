import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status: number = 400, details?: unknown) {
  return NextResponse.json({ success: false, error, details }, { status });
}

export function handleApiError(err: unknown) {
  console.error('[API Error]:', err);

  if (err instanceof ZodError) {
    const messages = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return errorResponse(messages || 'Validation failed', 422, err.issues);
  }

  if (err instanceof Error) {
    if (err.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required. Please sign in.', 401);
    }
    if (err.message === 'FORBIDDEN') {
      return errorResponse('Access denied. You do not own this resource.', 403);
    }
    if (err.message === 'NOT_FOUND' || err.message === 'USER_NOT_FOUND') {
      return errorResponse('Resource not found', 404);
    }
    return errorResponse(err.message, 500);
  }

  return errorResponse('An unexpected internal server error occurred', 500);
}
