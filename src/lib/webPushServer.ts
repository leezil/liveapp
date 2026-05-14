import webpush from "web-push";
import { pushSubStore } from "@/lib/pushSubscriptionStore";

let vapidConfigured = false;

export function isWebPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim());
}

export function configureWebPush(): void {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const contact = process.env.VAPID_CONTACT_EMAIL?.trim() || "mailto:noreply@localhost";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID 키가 설정되지 않았습니다.");
  }
  webpush.setVapidDetails(contact, publicKey, privateKey);
  vapidConfigured = true;
}

export async function broadcastWebPush(title: string, body: string): Promise<{
  sent: number;
  failed: number;
  removed: number;
}> {
  configureWebPush();
  const payload = JSON.stringify({ title, body });
  const subs = pushSubStore.getAll();
  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload, { TTL: 120 });
      sent += 1;
    } catch (err: unknown) {
      failed += 1;
      const status = typeof err === "object" && err !== null && "statusCode" in err ? (err as { statusCode?: number }).statusCode : undefined;
      if (status === 404 || status === 410) {
        pushSubStore.remove(sub.endpoint);
        removed += 1;
      }
    }
  }

  return { sent, failed, removed };
}
