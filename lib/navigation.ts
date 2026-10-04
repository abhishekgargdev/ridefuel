export type DashboardNavItem = {
  href: string;
  label: string;
  match?: 'exact' | 'prefix';
};

export const DASHBOARD_PRIMARY_NAV: DashboardNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', match: 'exact' },
  { href: '/dashboard/fuel', label: 'Fuel Logs', match: 'exact' },
  { href: '/dashboard/readings', label: 'Readings' },
  { href: '/dashboard/expenses', label: 'Expenses' },
  { href: '/dashboard/maintenance', label: 'Maintenance' },
];

export const DASHBOARD_MORE_NAV: DashboardNavItem[] = [
  { href: '/dashboard/mileage', label: 'Mileage' },
  { href: '/dashboard/fuel-analytics', label: 'Fuel Analytics' },
  { href: '/dashboard/range-calculator', label: 'Range Calc' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/service-history', label: 'Service History' },
  { href: '/dashboard/bikes', label: 'My Bikes' },
];

export const DASHBOARD_ACCOUNT_NAV: DashboardNavItem[] = [
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function isNavActive(pathname: string, href: string, match: DashboardNavItem['match'] = 'exact'): boolean {
  if (href === '/dashboard' || match === 'exact') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
