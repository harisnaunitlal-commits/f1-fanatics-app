// Custom Service Worker: handles Web Push notifications
// This file is bundled into the generated sw.js by @ducanh2912/next-pwa

declare const self: ServiceWorkerGlobalScope

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json() as {
    title: string
    body: string
    url?: string
    icon?: string
    badge?: string
    tag?: string
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon ?? '/logos/beira-f1.png',
    badge: data.badge ?? '/logos/beira-f1.png',
    tag: data.tag ?? 'f1-notification',
    data: { url: data.url ?? '/' },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url: string = (event.notification.data as { url: string })?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})
