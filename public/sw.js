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

/** 알림 클릭 시 이동할 경로 (같은 출처 기준) */
function openPathFromPayload(payload) {
  const u = payload && typeof payload.url === "string" ? payload.url.trim() : "";
  return u || "/watch";
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let payload = { title: "라이브 알림", body: "알림이 도착했습니다.", url: "/watch" };
      try {
        if (event.data && typeof event.data.json === "function") {
          const maybe = event.data.json();
          payload = (await Promise.resolve(maybe)) ?? payload;
        } else if (event.data && typeof event.data.text === "function") {
          const t = await event.data.text();
          payload = JSON.parse(t);
        }
      } catch {
        try {
          if (event.data && typeof event.data.text === "function") {
            const t = await event.data.text();
            payload = { title: "라이브 알림", body: t || "알림", url: "/watch" };
          }
        } catch {
          /* keep default */
        }
      }

      const openPath = openPathFromPayload(payload);
      await self.registration.showNotification(payload.title ?? "라이브 알림", {
        ...defaultNotifOpts,
        body: payload.body ?? "",
        data: { url: openPath },
      });
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "show-notification") return;
  const { title, body, opts } = event.data.payload ?? {};
  const fromOpts = opts && typeof opts === "object" ? opts : {};
  const openPath =
    fromOpts.data && typeof fromOpts.data === "object" && typeof fromOpts.data.url === "string" && fromOpts.data.url.trim()
      ? fromOpts.data.url.trim()
      : "/watch";
  event.waitUntil(
    self.registration.showNotification(title ?? "라이브 알림", {
      ...defaultNotifOpts,
      body: body ?? "알림 내용",
      ...fromOpts,
      data: { ...(typeof fromOpts.data === "object" && fromOpts.data ? fromOpts.data : {}), url: openPath },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const raw = event.notification.data && typeof event.notification.data === "object" && event.notification.data.url;
      const path = typeof raw === "string" && raw.trim() ? raw.trim() : "/watch";
      let targetUrl;
      try {
        targetUrl = new URL(path, self.location.origin).href;
      } catch {
        targetUrl = new URL("/watch", self.location.origin).href;
      }

      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of list) {
        let originOk = false;
        try {
          originOk = new URL(c.url).origin === self.location.origin;
        } catch {
          /* skip */
        }
        if (!originOk) continue;
        if ("navigate" in c && typeof c.navigate === "function") {
          try {
            const after = await c.navigate(targetUrl);
            if (after && "focus" in after) {
              await after.focus();
              return;
            }
          } catch {
            /* try next client or openWindow */
          }
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
    })(),
  );
});
