self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/logo.png",
      badge: data.badge || "/badge.png",
      data: data.data || {},
      tag: data.tag || "default",
      renotify: true,
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (err) {
    console.error("Error in service worker push event:", err);
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data;
  const urlToOpen = data && data.url ? data.url : "/notifications";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (windowClients) {
        // If a window is already open, focus it and navigate
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(location.origin) && "focus" in client) {
            return client.focus().then((focusedClient) => {
              if ("navigate" in focusedClient) {
                return focusedClient.navigate(urlToOpen);
              }
            });
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
