"use client";

import { useEffect, useRef } from "react";
import type { LiveMessage } from "@/types/live";

type Props = {
  messages: LiveMessage[];
  /** 송출 컨트롤 등과 겹치지 않도록 하단 여백 (Tailwind 클래스) */
  bottomReserveClass: string;
};

const VISIBLE = 22;

export function LiveChatOverlay({ messages, bottomReserveClass }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const list = messages.slice(-VISIBLE);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-end ${bottomReserveClass}`}
      aria-live="polite"
    >
      <div
        className="live-chat-fade max-h-[min(46dvh,360px)] min-h-0 overflow-hidden px-3 pt-16"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.65) 18%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.65) 18%, black 100%)",
        }}
      >
        <div
          ref={scrollRef}
          className="live-chat-scroll flex max-h-full min-h-0 flex-col justify-end gap-1 overflow-y-auto pb-1 pr-0.5"
        >
          {list.map((m) => (
            <div
              key={m.id}
              className="max-w-[95%] rounded-2xl border border-white/10 bg-black/35 px-2.5 py-1.5 text-[13px] leading-snug text-white shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-black/25"
            >
              <span className="font-semibold text-emerald-300">{m.author}</span>
              <span className="text-zinc-100"> {m.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
