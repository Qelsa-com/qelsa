/* Qelsa Agent web-push service worker. */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Qelsa Agent", body: event.data ? event.data.text() : "You have a new update." };
  }
  const title = data.title || "Qelsa Agent";
  const options = {
    body: data.body || "New matches and next steps are ready.",
    icon: "/apple-touch-icon.png",
    badge: "/favicon.ico",
    tag: data.tag || "qelsa-agent",
    data: { url: data.url || "/agent" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/agent";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow(target);
    }),
  );
});
