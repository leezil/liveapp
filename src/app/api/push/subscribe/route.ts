import { NextResponse } from "next/server";
import type { PushSubscription } from "web-push";
import { pushSubStore } from "@/lib/pushSubscriptionStore";
import { isWebPushConfigured } from "@/lib/webPushServer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isWebPushConfigured()) {
    return NextResponse.json({ ok: false, error: "VAPID 미설정 — npm run gen:vapid 후 .env.local 참고" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 파싱 실패" }, { status: 400 });
  }

  const sub = body as PushSubscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ ok: false, error: "유효하지 않은 subscription" }, { status: 400 });
  }

  pushSubStore.add(sub);
  return NextResponse.json({ ok: true, subscribers: pushSubStore.size });
}
