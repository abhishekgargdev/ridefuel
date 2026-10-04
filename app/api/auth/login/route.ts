import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { Repository } from '@/lib/db/repository';
import { verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const user = await Repository.findUserByEmail(validated.email);
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    const isMatch = await verifyPassword(validated.password, user.passwordHash);
    if (!isMatch) {
      return errorResponse('Invalid email or password', 401);
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      distanceUnit: user.distanceUnit,
      fuelUnit: user.fuelUnit,
    };

    const response = successResponse({
      user: safeUser,
      token,
      message: 'Login successful',
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
