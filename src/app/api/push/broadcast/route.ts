import { NextResponse } from "next/server";
import { broadcastWebPush, isWebPushConfigured } from "@/lib/webPushServer";

export const dynamic = "force-dynamic";

type Body = {
  title?: string;
  body?: string;
  pin?: string;
};

export async function POST(request: Request) {
  if (!isWebPushConfigured()) {
    return NextResponse.json({ ok: false, error: "VAPID 미설정" }, { status: 503 });
  }

  const pinRequired = Boolean(process.env.CREW_PUSH_PIN?.trim());
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 파싱 실패" }, { status: 400 });
  }

  if (pinRequired && body.pin !== process.env.CREW_PUSH_PIN) {
    return NextResponse.json({ ok: false, error: "PIN이 필요하거나 일치하지 않습니다." }, { status: 401 });
  }

  const title = body.title?.trim() || "Live App";
  const text = body.body?.trim() || "알림이 도착했습니다.";

  try {
    const result = await broadcastWebPush(title, text);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "발송 실패";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
