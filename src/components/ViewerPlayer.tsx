"use client";

import { useEffect, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCClient, type IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { agoraEnvSummary, liveDebug, liveDebugError } from "@/lib/debugLive";

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";
const token = process.env.NEXT_PUBLIC_AGORA_TOKEN || null;
const channel = process.env.NEXT_PUBLIC_AGORA_CHANNEL ?? "film-live-room";

export function ViewerPlayer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    liveDebug("viewer", "마운트", { env: agoraEnvSummary() });
    if (!appId) {
      liveDebug("viewer", "App ID 없음 — join 생략");
      return;
    }

    let client: IAgoraRTCClient | null = null;
    let remoteTrack: IRemoteVideoTrack | null = null;

    const setup = async () => {
      try {
        client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        client.setClientRole("audience");
        client.on("connection-state-change", (cur, prev) => {
          liveDebug("viewer", `연결 상태 ${prev} → ${cur}`);
        });

        client.on("user-published", async (user, mediaType) => {
          liveDebug("viewer", "user-published", { uid: user.uid, mediaType });
          await client?.subscribe(user, mediaType);
          if (mediaType === "video" && user.videoTrack && containerRef.current) {
            remoteTrack = user.videoTrack;
            remoteTrack.play(containerRef.current);
            liveDebug("viewer", "원격 비디오 재생 시작");
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          liveDebug("viewer", "user-unpublished", { uid: user.uid, mediaType });
        });

        liveDebug("viewer", "채널 join 시도", { channel, uid: null });
        await client.join(appId, channel, token, null);
        setConnected(true);
        liveDebug("viewer", "join 완료 — 호스트 publish 대기 중");
      } catch (e) {
        liveDebugError("viewer", "시청 연결 실패", e);
        setError(e instanceof Error ? e.message : "시청 연결 중 오류가 발생했습니다.");
      }
    };

    void setup();
    return () => {
      liveDebug("viewer", "언마운트 — 정리");
      remoteTrack?.stop();
      void client?.leave();
    };
  }, []);

  return (
    <section className="space-y-3 rounded-2xl bg-zinc-900 p-4 text-white">
      <h2 className="text-lg font-semibold">시청 화면</h2>
      <div ref={containerRef} className="aspect-[9/16] w-full rounded-xl bg-black" />
      {!appId && (
        <p className="text-xs text-amber-300">Agora App ID 미설정 상태입니다. `.env.local`을 먼저 채워주세요.</p>
      )}
      {connected && <p className="text-xs text-emerald-300">실시간 스트림에 연결되었습니다.</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </section>
  );
}
