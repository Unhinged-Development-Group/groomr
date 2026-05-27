import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Groomr',
    short_name: 'Groomr',
    description:
      "Book your dog's next groom in minutes. Local, independent, verified groomers across the UK.",
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#2c3e50',
    theme_color: '#2c3e50',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  }
}
