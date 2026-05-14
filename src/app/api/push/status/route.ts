import { NextResponse } from "next/server";
import { pushSubStore } from "@/lib/pushSubscriptionStore";
import { isWebPushConfigured } from "@/lib/webPushServer";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    configured: isWebPushConfigured(),
    pinRequired: Boolean(process.env.CREW_PUSH_PIN?.trim()),
    subscribers: pushSubStore.size,
  });
}
