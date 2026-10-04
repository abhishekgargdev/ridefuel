import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'RideFuel - Motorcycle Fuel, Mileage & Maintenance Tracker',
  description:
    'Production-grade PWA for personal motorcycle fuel tracking, range estimation, mileage analytics, expense management, and maintenance logs for Royal Enfield Classic 350 and multi-bike fleets.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RideFuel',
  },
  openGraph: {
    title: 'RideFuel - Motorcycle Fuel, Mileage & Maintenance Tracker',
    description:
      'Production-grade PWA for personal motorcycle fuel tracking, range estimation, mileage analytics, expense management, and maintenance logs for Royal Enfield Classic 350 and multi-bike fleets.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RideFuel - Motorcycle Fuel, Mileage & Maintenance Tracker',
    description:
      'Production-grade PWA for personal motorcycle fuel tracking, range estimation, mileage analytics, expense management, and maintenance logs for Royal Enfield Classic 350 and multi-bike fleets.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <AuthProvider>
          {children}
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
