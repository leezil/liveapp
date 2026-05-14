"use client";

import dynamic from "next/dynamic";
import { LiveImmersiveShell } from "@/components/LiveImmersiveShell";
import { useLiveFeed } from "@/hooks/useLiveFeed";

const BroadcastStudio = dynamic(
  () => import("@/components/BroadcastStudio").then((m) => m.BroadcastStudio),
  { ssr: false },
);

export default function BroadcastPage() {
  const { state, latestMessages, connected } = useLiveFeed();

  return (
    <LiveImmersiveShell
      title={state.title}
      isLive={state.isLive}
      connected={connected}
      messages={latestMessages}
    >
      <BroadcastStudio variant="immersive" />
    </LiveImmersiveShell>
  );
}
