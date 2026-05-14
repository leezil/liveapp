"use client";

import dynamic from "next/dynamic";
import { LiveImmersiveShell } from "@/components/LiveImmersiveShell";
import { useLiveFeed } from "@/hooks/useLiveFeed";

const ViewerPlayer = dynamic(
  () => import("@/components/ViewerPlayer").then((m) => m.ViewerPlayer),
  { ssr: false },
);

export default function WatchPage() {
  const { latestMessages, refetch } = useLiveFeed();

  return (
    <LiveImmersiveShell messages={latestMessages} onChatSent={refetch}>
      <ViewerPlayer variant="immersive" />
    </LiveImmersiveShell>
  );
}
