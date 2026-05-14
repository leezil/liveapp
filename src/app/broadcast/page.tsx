"use client";

import dynamic from "next/dynamic";
import { ChatOverlay } from "@/components/ChatOverlay";
import { useLiveFeed } from "@/hooks/useLiveFeed";

const BroadcastStudio = dynamic(
  () => import("@/components/BroadcastStudio").then((m) => m.BroadcastStudio),
  { ssr: false },
);

export default function BroadcastPage() {
  const { state, latestMessages, connected } = useLiveFeed();

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-3 bg-zinc-950 p-3 text-white">
      <p className="text-xs text-zinc-300">연결 상태: {connected ? "SSE 연결됨" : "재연결 중"}</p>
      <div className="relative overflow-hidden rounded-2xl">
        <BroadcastStudio />
        <ChatOverlay messages={latestMessages} />
      </div>
      <div className="rounded-xl bg-zinc-900 p-3 text-sm">
        <p className="font-semibold">{state.title}</p>
        <p className="text-zinc-400">상태: {state.isLive ? "LIVE" : "OFFLINE"}</p>
      </div>
    </main>
  );
}
