const NOTIFICATION_TAG = "liveapp-demo";

export async function registerPushWorker() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  try {
    await registration.update();
  } catch {
    /* ignore */
  }
  return registration;
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

/** 로컬 알림(연출용). 모바일 크롬은 `registration.showNotification` 경로가 안정적입니다. */
export async function showLocalPush(title: string, body: string, openPath: string = "/watch") {
  if (!("serviceWorker" in navigator)) return false;

  const registration = await registerPushWorker();
  if (!registration) return false;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return false;

  await navigator.serviceWorker.ready;

  type ExtendedNotificationOptions = NotificationOptions & {
    vibrate?: number[];
  };

  const path = openPath.trim() || "/watch";
  const opts: ExtendedNotificationOptions = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: NOTIFICATION_TAG,
    vibrate: [100, 50, 100],
    silent: false,
    data: { url: path },
  };

  try {
    await registration.showNotification(title, opts);
    return true;
  } catch {
    /* 일부 환경에서만 SW 메시지 경로 */
  }

  if (registration.active) {
    registration.active.postMessage({
      type: "show-notification",
      payload: { title, body, opts },
    });
    return true;
  }

  return false;
}
