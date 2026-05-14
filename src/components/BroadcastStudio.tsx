"use client";

import { useMemo, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCClient, type ICameraVideoTrack } from "agora-rtc-sdk-ng";
import { agoraEnvSummary, liveDebug, liveDebugError } from "@/lib/debugLive";

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";
const token = process.env.NEXT_PUBLIC_AGORA_TOKEN || null;
const channel = process.env.NEXT_PUBLIC_AGORA_CHANNEL ?? "film-live-room";

export function BroadcastStudio() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string>("");
  const videoRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const trackRef = useRef<ICameraVideoTrack | null>(null);

  const canUseAgora = useMemo(() => Boolean(appId), []);

  const startPublishing = async () => {
    setError("");
    liveDebug("broadcast", "라이브 시작 클릭", { env: agoraEnvSummary() });
    if (!canUseAgora) {
      setError("NEXT_PUBLIC_AGORA_APP_ID가 없어 영상 송출을 시작할 수 없습니다.");
      return;
    }
    try {
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      client.setClientRole("host");
      client.on("connection-state-change", (cur, prev) => {
        liveDebug("broadcast", `연결 상태 ${prev} → ${cur}`);
      });

      liveDebug("broadcast", "카메라 트랙 생성 시도");
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      liveDebug("broadcast", "채널 join 시도", { channel, uid: null });
      await client.join(appId, channel, token, null);
      liveDebug("broadcast", "publish 시도");
      await client.publish(videoTrack);

      if (videoRef.current) {
        videoTrack.play(videoRef.current);
      }

      clientRef.current = client;
      trackRef.current = videoTrack;
      setIsPublishing(true);
      liveDebug("broadcast", "송출 시작 완료");
    } catch (e) {
      liveDebugError("broadcast", "송출 시작 실패", e);
      setError(e instanceof Error ? e.message : "송출 시작 중 오류가 발생했습니다.");
    }
  };

  const stopPublishing = async () => {
    liveDebug("broadcast", "라이브 종료 클릭");
    try {
      await clientRef.current?.unpublish();
      await clientRef.current?.leave();
      trackRef.current?.stop();
      trackRef.current?.close();
      clientRef.current = null;
      trackRef.current = null;
      setIsPublishing(false);
      liveDebug("broadcast", "송출 종료 완료");
    } catch (e) {
      liveDebugError("broadcast", "송출 종료 실패", e);
      setError(e instanceof Error ? e.message : "송출 종료 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="space-y-3 rounded-2xl bg-zinc-900 p-4 text-white">
      <h2 className="text-lg font-semibold">송출 화면</h2>
      <div ref={videoRef} className="aspect-[9/16] w-full rounded-xl bg-black" />
      <div className="flex gap-2">
        <button
          onClick={startPublishing}
          disabled={isPublishing}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          라이브 시작
        </button>
        <button
          onClick={stopPublishing}
          disabled={!isPublishing}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          라이브 종료
        </button>
      </div>
      {!canUseAgora && <p className="text-xs text-amber-300">`.env.local`에 Agora App ID를 설정하세요.</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </section>
  );
}
