/* Service Worker — Shellton Auto Mecânica
 * Recebe notificações push e abre o painel ao clicar.
 */

self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Shellton", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Shellton Auto Mecânica";
  const options = {
    body: data.body || "Você tem uma nova notificação.",
    icon: data.icon || "/favicon/favicon-for-public/web-app-manifest-192x192.png",
    badge: "/favicon/favicon-for-public/web-app-manifest-192x192.png",
    vibrate: [120, 60, 120],
    tag: data.tag || "shellton-notify",
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/admin/dashboard",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    "/admin/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
