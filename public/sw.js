self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "라이브 알림", body: "새 라이브가 시작됐어요." };
  try {
    payload = event.data?.json() ?? payload;
  } catch {
    // ignore malformed payload
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "show-notification") return;
  const { title, body } = event.data.payload ?? {};
  event.waitUntil(
    self.registration.showNotification(title ?? "라이브 알림", {
      body: body ?? "알림 내용",
    }),
  );
});
