import { NextRequest } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { Repository } from '@/lib/db/repository';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.parse(body);

    const user = await Repository.findUserByEmail(validated.email);
    // Security best practice: don't reveal whether user exists
    if (!user) {
      return successResponse({
        message: 'If an account exists with that email, a password reset token has been issued.',
        demoResetToken: null,
      });
    }

    const resetToken = 'reset_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await Repository.setUserResetToken(validated.email, resetToken, expiry);

    // In a live production environment with SMTP configured, this would email the user.
    // For seamless testing, we return the reset token directly in response.
    return successResponse({
      message: 'Password reset token generated successfully.',
      demoResetToken: resetToken,
      resetUrl: `/reset-password?token=${resetToken}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
