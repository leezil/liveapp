"use client";

import dynamic from "next/dynamic";
import { LiveImmersiveShell } from "@/components/LiveImmersiveShell";
import { useLiveFeed } from "@/hooks/useLiveFeed";

const BroadcastStudio = dynamic(
  () => import("@/components/BroadcastStudio").then((m) => m.BroadcastStudio),
  { ssr: false },
);

export default function BroadcastPage() {
  const { latestMessages, refetch } = useLiveFeed();

  return (
    <LiveImmersiveShell
      messages={latestMessages}
      chatReserveBottom="broadcast"
      onChatSent={refetch}
    >
      <BroadcastStudio variant="immersive" />
    </LiveImmersiveShell>
  );
}
