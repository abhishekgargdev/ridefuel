import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    const user = await Repository.findUserById(session.userId);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const bikes = await Repository.getBikesByUser(session.userId);

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency || '₹',
        distanceUnit: user.distanceUnit || 'km',
        fuelUnit: user.fuelUnit || 'liters',
      },
      bikes,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return errorResponse('Not authenticated', 401);
    }

    const body = await req.json();
    const updated = await Repository.updateUser(session.userId, {
      name: body.name,
      currency: body.currency,
      distanceUnit: body.distanceUnit,
      fuelUnit: body.fuelUnit,
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
