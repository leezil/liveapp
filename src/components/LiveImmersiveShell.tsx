"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveMessage } from "@/types/live";
import { LiveChatComposer } from "@/components/LiveChatComposer";
import { LiveChatOverlay } from "@/components/LiveChatOverlay";

type Props = {
  messages: LiveMessage[];
  chatReserveBottom?: "watch" | "broadcast";
  children: React.ReactNode;
  onChatSent?: () => void;
};

export function LiveImmersiveShell({ messages, chatReserveBottom = "watch", children, onChatSent }: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [fsActive, setFsActive] = useState(false);

  const overlayBottomPad =
    chatReserveBottom === "broadcast"
      ? "pb-[calc(10rem+env(safe-area-inset-bottom,0px))]"
      : "pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))]";

  useEffect(() => {
    const sync = () => setFsActive(Boolean(document.fullscreenElement === rootRef.current));
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
      /* 미지원 브라우저 */
    }
  }, []);

  return (
    <main
      ref={rootRef}
      className="relative flex h-[100dvh] max-h-[100dvh] w-full touch-manipulation flex-col overflow-hidden bg-black text-white"
    >
      <div className="relative min-h-0 flex-1">
        {children}

        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex justify-center pt-[max(0.4rem,env(safe-area-inset-top))]"
          style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Live</span>
          </div>
        </div>

        <LiveChatOverlay messages={messages} bottomReserveClass={overlayBottomPad} />
      </div>

      <LiveChatComposer
        onSent={onChatSent}
        onToggleFullscreen={() => void toggleFullscreen()}
        fullscreenActive={fsActive}
      />
    </main>
  );
}
