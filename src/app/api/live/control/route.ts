import { NextResponse } from "next/server";
import { liveDebug, liveDebugError } from "@/lib/debugLive";
import { liveStore } from "@/lib/liveStore";

export const dynamic = "force-dynamic";

const defaultScript = [
  { author: "movie_fan01", text: "와 화면 분위기 진짜 좋다" },
  { author: "nightowl", text: "지금 장소 어디예요?" },
  { author: "cinema_park", text: "채팅 속도 미쳤다 ㄷㄷ" },
  { author: "hello_j", text: "소리 잘 들려요!" },
  { author: "runrun", text: "좋아요 눌렀어요" },
];

type Body = {
  action?: "start" | "stop" | "script" | "message";
  title?: string;
  intervalMs?: number;
  script?: Array<{ author: string; text: string }>;
  author?: string;
  text?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch (e) {
    liveDebugError("api/control", "JSON 파싱 실패", e);
    return NextResponse.json({ ok: false, error: "잘못된 JSON 본문" }, { status: 400 });
  }

  liveDebug("api/control", "POST", { action: body.action, hasTitle: Boolean(body.title?.trim()) });

  switch (body.action) {
    case "start":
      liveStore.startLive(body.title);
      return NextResponse.json({ ok: true, state: liveStore.getState() });
    case "stop":
      liveStore.stopLive();
      return NextResponse.json({ ok: true, state: liveStore.getState() });
    case "script":
      liveStore.startScript(body.script ?? defaultScript, Math.max(body.intervalMs ?? 900, 150));
      return NextResponse.json({ ok: true });
    case "message":
      if (!body.author || !body.text) {
        return NextResponse.json({ ok: false, error: "author, text 필요" }, { status: 400 });
      }
      liveStore.pushMessage(body.author, body.text);
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ ok: false, error: "알 수 없는 액션" }, { status: 400 });
  }
}
