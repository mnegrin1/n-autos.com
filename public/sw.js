// N-Autos & N-Sistemas Service Worker para PWA y Notificaciones Push

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Manejo de eventos de Notificación Push entrantes
self.addEventListener('push', (event) => {
  let data = {
    title: 'N-Autos CRM',
    body: 'Tienes una nueva consulta o mensaje entrante.',
    url: '/admin/inbox',
    icon: '/logo-n-sistemas-square.png',
    badge: '/icon.png'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo-n-sistemas-square.png',
    badge: data.badge || '/icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/admin/inbox'
    },
    actions: [
      {
        action: 'open_inbox',
        title: 'Ver Mensaje'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Evento al tocar la notificación push en el celular
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/admin/inbox';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
