self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Elo Log', body: 'Novo frete disponível em tempo real!' };
  const options = {
    body: data.body || 'Um novo frete foi publicado na plataforma.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Elo Log - Alerta de Frete', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
