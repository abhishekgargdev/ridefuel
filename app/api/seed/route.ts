import { NextRequest } from 'next/server';
import { Repository } from '@/lib/db/repository';
import { successResponse, handleApiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    await Repository.resetToSeed();
    return successResponse({
      message: 'Demo dataset for Royal Enfield Classic 350 (2022) initialized successfully.',
      demoCredentials: {
        email: 'demo@ridefuel.com',
        password: 'Password123!',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
