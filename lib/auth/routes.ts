export const LOGIN_PATH = '/login';
export const DASHBOARD_PATH = '/dashboard';

export const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
] as const;

export const PUBLIC_ROUTES = [
  '/',
  '/features',
  '/about',
  ...AUTH_ROUTES,
] as const;

export function isPrivateRoute(pathname: string): boolean {
  return pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`);
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number])) {
    return true;
  }
  return PUBLIC_ROUTES.some((route) => route !== '/' && pathname.startsWith(`${route}/`));
}

/** Only allow in-app dashboard redirects to prevent open redirects. */
export function getSafeRedirect(value: string | null | undefined): string {
  if (!value) return DASHBOARD_PATH;
  let path = value.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return DASHBOARD_PATH;
  }
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return DASHBOARD_PATH;
  }
  if (!isPrivateRoute(path.split('?')[0])) {
    return DASHBOARD_PATH;
  }
  return path;
}
