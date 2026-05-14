"use client";

import { useEffect, useRef } from "react";
import type { LiveMessage } from "@/types/live";

type Props = { messages: LiveMessage[] };

export function LiveChatDock({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const list = messages.slice(-80);

  return (
    <div
      className="flex max-h-[min(38dvh,320px)] min-h-[140px] shrink-0 flex-col border-t border-white/10 bg-zinc-950/95 backdrop-blur-md"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <p className="shrink-0 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        실시간 채팅
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        <div className="flex flex-col gap-1.5">
          {list.map((m) => (
            <div key={m.id} className="rounded-lg bg-black/45 px-2.5 py-1.5 text-[13px] leading-snug">
              <span className="font-semibold text-emerald-400">{m.author}</span>
              <span className="text-zinc-200"> {m.text}</span>
            </div>
          ))}
        </div>
        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>
    </div>
  );
}
