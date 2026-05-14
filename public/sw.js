self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const defaultNotifOpts = {
  icon: "/icon-192.png",
  badge: "/icon-192.png",
  tag: "liveapp-demo",
  vibrate: [100, 50, 100],
};

self.addEventListener("push", (event) => {
  let payload = { title: "라이브 알림", body: "새 라이브가 시작됐어요." };
  try {
    payload = event.data?.json() ?? payload;
  } catch {
    // ignore malformed payload
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      ...defaultNotifOpts,
      body: payload.body,
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "show-notification") return;
  const { title, body, opts } = event.data.payload ?? {};
  event.waitUntil(
    self.registration.showNotification(title ?? "라이브 알림", {
      ...defaultNotifOpts,
      body: body ?? "알림 내용",
      ...(opts && typeof opts === "object" ? opts : {}),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url && "focus" in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/watch");
    }),
  );
});
