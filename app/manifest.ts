import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'RideFuel - Motorcycle Fuel & Maintenance',
    short_name: 'RideFuel',
    description: 'Personal motorcycle fuel, mileage, expense and maintenance tracker designed for Royal Enfield Classic 350 and multi-bike fleets.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#0f172a',
    orientation: 'portrait',
    categories: ['automotive', 'utilities', 'productivity'],
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
