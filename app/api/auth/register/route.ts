import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { Repository } from '@/lib/db/repository';
import { hashPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const existing = await Repository.findUserByEmail(validated.email);
    if (existing) {
      return errorResponse('An account with this email already exists', 409);
    }

    const passwordHash = await hashPassword(validated.password);
    const newUser = await Repository.createUser({
      name: validated.name,
      email: validated.email,
      passwordHash,
    });

    // Create initial Royal Enfield Classic 350 for the new user automatically
    const defaultBike = await Repository.createBike(newUser.id, {
      name: 'Royal Enfield Classic 350',
      manufacturer: 'Royal Enfield',
      model: 'Classic 350',
      variant: 'Standard / Dark Series',
      year: 2022,
      initialOdometer: 0,
      currentOdometer: 0,
      tankCapacity: 13,
      reserveCapacity: 2.6,
      expectedMileage: 35.0,
      isActive: true,
      notes: 'Initial motorcycle created automatically. You can edit this anytime or add more bikes.',
    });

    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const response = successResponse(
      {
        user: newUser,
        bike: defaultBike,
        message: 'Account created successfully',
      },
      201
    );

    // Set HTTP-only secure cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
