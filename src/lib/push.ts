export async function registerPushWorker() {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register("/sw.js");
  return registration;
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export async function showLocalPush(title: string, body: string) {
  const registration = await registerPushWorker();
  if (!registration) return false;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") return false;

  if (registration.active) {
    registration.active.postMessage({
      type: "show-notification",
      payload: { title, body },
    });
    return true;
  }

  return false;
}
