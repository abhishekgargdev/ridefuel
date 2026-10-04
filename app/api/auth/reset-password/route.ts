import { NextRequest } from 'next/server';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { Repository } from '@/lib/db/repository';
import { hashPassword } from '@/lib/auth/password';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = resetPasswordSchema.parse(body);

    const newPasswordHash = await hashPassword(validated.newPassword);
    const success = await Repository.resetPasswordWithToken(validated.token, newPasswordHash);

    if (!success) {
      return errorResponse('Invalid or expired password reset token', 400);
    }

    return successResponse({
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
