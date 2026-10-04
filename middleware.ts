import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/constants';
import { verifyToken } from '@/lib/auth/jwt';
import { DASHBOARD_PATH, getSafeRedirect, isAuthRoute, isPrivateRoute, LOGIN_PATH } from '@/lib/auth/routes';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  const clearInvalidCookie = (response: NextResponse) => {
    if (token && !session) {
      response.cookies.set(AUTH_COOKIE_NAME, '', { expires: new Date(0), path: '/' });
    }
    return response;
  };

  if (isPrivateRoute(pathname) && !session) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('redirect', getSafeRedirect(`${pathname}${search}`));
    return clearInvalidCookie(NextResponse.redirect(loginUrl));
  }

  if (isAuthRoute(pathname) && session) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return clearInvalidCookie(NextResponse.next());
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ],
};
