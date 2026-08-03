import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KmC — Distance Check',
    short_name: 'KmC',
    description: 'Calcolo distanze tra punto di sparo e indirizzo destinatario',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f6f9',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
