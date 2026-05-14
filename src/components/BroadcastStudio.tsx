"use client";

import { useMemo, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCClient, type ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { agoraEnvSummary, liveDebug, liveDebugError } from "@/lib/debugLive";

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";
const token = process.env.NEXT_PUBLIC_AGORA_TOKEN || null;
const channel = process.env.NEXT_PUBLIC_AGORA_CHANNEL ?? "film-live-room";

function formatBroadcastStartError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const code =
    e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";

  if (
    code === "DEVICE_NOT_FOUND" ||
    msg.includes("DEVICE_NOT_FOUND") ||
    msg.includes("Requested device not found")
  ) {
    return "카메라를 찾을 수 없습니다. 웹캠 연결·브라우저 카메라 권한(주소창 자물쇠 아이콘)을 확인하세요. 원격 데스크톱·일부 VM에는 카메라가 없을 수 있습니다. 웹캠이 없으면 아래 「화면 공유 송출」을 사용하세요.";
  }
  if (code === "PERMISSION_DENIED" || msg.includes("NotAllowedError") || msg.includes("PERMISSION_DENIED")) {
    return "카메라·화면 사용이 거부되었습니다. 브라우저에서 이 사이트의 권한을 허용한 뒤 다시 시도하세요.";
  }
  return msg;
}

type BroadcastStudioProps = {
  /** immersive: 전체 스테이지 안에서만 사용 (부모가 높이·채팅 레이아웃 제공) */
  variant?: "panel" | "immersive";
};

export function BroadcastStudio({ variant = "panel" }: BroadcastStudioProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string>("");
  const videoRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const trackRef = useRef<ILocalVideoTrack | null>(null);

  const canUseAgora = useMemo(() => Boolean(appId), []);

  const startPublishing = async (mode: "camera" | "screen") => {
    setError("");
    liveDebug("broadcast", "라이브 시작 클릭", { mode, env: agoraEnvSummary() });
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

      liveDebug("broadcast", mode === "camera" ? "카메라 트랙 생성 시도" : "화면 공유 트랙 생성 시도");
      const videoTrack: ILocalVideoTrack =
        mode === "camera"
          ? await AgoraRTC.createCameraVideoTrack()
          : await AgoraRTC.createScreenVideoTrack({}, "disable");

      if (mode === "screen") {
        videoTrack.on("track-ended", () => {
          liveDebug("broadcast", "화면 공유가 브라우저에서 종료됨");
          void stopPublishing();
        });
      }

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
      setError(formatBroadcastStartError(e));
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

  const controlButtons = (
    <>
      <button
        type="button"
        onClick={() => void startPublishing("camera")}
        disabled={isPublishing}
        className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold shadow-lg disabled:opacity-50 sm:text-sm"
      >
        카메라
      </button>
      <button
        type="button"
        onClick={() => void startPublishing("screen")}
        disabled={isPublishing}
        className="rounded-lg border border-white/25 bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-white shadow-lg disabled:opacity-50 sm:text-sm"
      >
        화면 공유
      </button>
      <button
        type="button"
        onClick={() => void stopPublishing()}
        disabled={!isPublishing}
        className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold shadow-lg disabled:opacity-50 sm:text-sm"
      >
        종료
      </button>
    </>
  );

  if (variant === "immersive") {
    return (
      <div className="flex h-full min-h-0 flex-col text-white">
        <div className="live-stage-host relative min-h-0 flex-1 bg-black">
          <div ref={videoRef} className="absolute inset-0" />
          {!canUseAgora && (
            <p className="absolute left-3 right-3 top-14 rounded-lg bg-amber-500/25 px-3 py-2 text-center text-xs text-amber-100 backdrop-blur-sm">
              `.env.local`에 Agora App ID를 설정하세요.
            </p>
          )}
          {error && (
            <p className="absolute left-3 right-3 top-3 max-h-[28vh] overflow-y-auto rounded-lg bg-rose-950/90 px-3 py-2 text-xs leading-snug text-rose-100 backdrop-blur-sm">
              {error}
            </p>
          )}
          <div
            className="pointer-events-none absolute inset-x-0 bg-gradient-to-t from-black via-black/75 to-transparent px-3 pt-16"
            style={{
              bottom: "calc(5.75rem + env(safe-area-inset-bottom, 0px))",
              paddingBottom: "0.5rem",
            }}
          >
            <div className="pointer-events-auto flex flex-wrap justify-center gap-2">{controlButtons}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl bg-zinc-900 p-4 text-white">
      <h2 className="text-lg font-semibold">송출 화면</h2>
      <div ref={videoRef} className="aspect-[9/16] w-full rounded-xl bg-black" />
      <div className="flex flex-wrap gap-2">{controlButtons}</div>
      {!canUseAgora && <p className="text-xs text-amber-300">`.env.local`에 Agora App ID를 설정하세요.</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </section>
  );
}
