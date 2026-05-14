"use client";

import dynamic from "next/dynamic";
import { LiveImmersiveShell } from "@/components/LiveImmersiveShell";
import { useLiveFeed } from "@/hooks/useLiveFeed";

const ViewerPlayer = dynamic(
  () => import("@/components/ViewerPlayer").then((m) => m.ViewerPlayer),
  { ssr: false },
);

export default function WatchPage() {
  const { state, latestMessages, connected } = useLiveFeed();

  return (
    <LiveImmersiveShell
      title={state.title}
      isLive={state.isLive}
      connected={connected}
      messages={latestMessages}
    >
      <ViewerPlayer variant="immersive" />
    </LiveImmersiveShell>
  );
}
