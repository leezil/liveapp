"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveMessage } from "@/types/live";
import { LiveChatDock } from "@/components/LiveChatDock";

type Props = {
  title: string;
  isLive: boolean;
  connected: boolean;
  messages: LiveMessage[];
  children: React.ReactNode;
};

export function LiveImmersiveShell({ title, isLive, connected, messages, children }: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [fsActive, setFsActive] = useState(false);

  useEffect(() => {
    const sync = () => {
      const el = rootRef.current;
      setFsActive(Boolean(el && document.fullscreenElement === el));
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* 일부 모바일 브라우저는 요소 전체화면 미지원 */
    }
  }, []);

  return (
    <main
      ref={rootRef}
      className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-black text-white"
    >
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-sm"
        style={{
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${isLive ? "animate-pulse bg-red-500" : "bg-zinc-600"}`}
              aria-hidden
            />
            <p className="truncate font-semibold">{title}</p>
          </div>
          <p className="truncate text-[11px] text-zinc-400">
            {connected ? "채팅·상태 연결됨" : "채팅 연결 재시도 중…"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white active:bg-white/20"
          >
            {fsActive ? "전체화면 끝" : "전체화면"}
          </button>
          <Link
            href="/"
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white active:bg-white/20"
          >
            나가기
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">{children}</div>
        <LiveChatDock messages={messages} />
      </div>
    </main>
  );
}
