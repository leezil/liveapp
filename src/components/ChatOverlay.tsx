"use client";

import type { LiveMessage } from "@/types/live";

type Props = {
  messages: LiveMessage[];
};

export function ChatOverlay({ messages }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
      <div className="flex max-h-56 flex-col gap-2 overflow-hidden">
        {messages.slice(-8).map((message) => (
          <div
            key={message.id}
            className="rounded-xl bg-black/55 px-3 py-2 text-sm text-white shadow-sm backdrop-blur-sm"
          >
            <span className="mr-2 font-semibold text-emerald-300">{message.author}</span>
            <span>{message.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
