import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from './jwt';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export { AUTH_COOKIE_NAME };

export async function getSessionUser(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch (e) {
      // Ignore if called outside request context
    }
  }

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function requireAuthUser(req?: NextRequest): Promise<{ user: TokenPayload }> {
  const payload = await getSessionUser(req);
  if (!payload) {
    throw new Error('UNAUTHORIZED');
  }

  return { user: payload };
}
