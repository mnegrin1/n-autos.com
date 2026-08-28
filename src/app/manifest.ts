import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'N-Autos CRM | N-Sistemas',
    short_name: 'N-Autos CRM',
    description: 'Gestión de automotoras, stock de vehículos y mensajería en tiempo real para vendedores.',
    start_url: '/admin/inbox',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo-n-sistemas-square.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logo-n-sistemas-square.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    shortcuts: [
      {
        name: 'Responder Mensajes',
        short_name: 'Mensajes',
        description: 'Abrir la bandeja de entrada de consultas',
        url: '/admin/inbox',
        icons: [{ src: '/logo-n-sistemas-square.png', sizes: '192x192' }]
      },
      {
        name: 'Nueva Publicación',
        short_name: 'Publicar',
        description: 'Cargar un nuevo vehículo con fotos desde el celular',
        url: '/admin/vehicles?action=new',
        icons: [{ src: '/logo-n-sistemas-square.png', sizes: '192x192' }]
      }
    ]
  };
}
