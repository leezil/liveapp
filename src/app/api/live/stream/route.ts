import { liveDebug } from "@/lib/debugLive";
import { liveStore } from "@/lib/liveStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  liveDebug("api/stream", "SSE 연결 수립");

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = async (payload: string) => {
    await writer.write(encoder.encode(payload));
  };

  await send(`data: ${JSON.stringify({ type: "state", payload: liveStore.getState() })}\n\n`);

  const unsubscribe = liveStore.subscribe((event) => {
    void send(`data: ${JSON.stringify(event)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    void send(": ping\n\n");
  }, 15000);

  request.signal.addEventListener("abort", () => {
    liveDebug("api/stream", "SSE 연결 종료 (abort)");
    clearInterval(keepAlive);
    unsubscribe();
    void writer.close();
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
