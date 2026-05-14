"use client";

import { AdminPanel } from "@/components/AdminPanel";
import { useLiveFeed } from "@/hooks/useLiveFeed";

export default function AdminPage() {
  const { state } = useLiveFeed();

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-3 bg-zinc-950 p-3 text-white">
      <AdminPanel />
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm">
        <p className="font-semibold">현재 상태</p>
        <p className="text-zinc-300">라이브: {state.isLive ? "ON" : "OFF"}</p>
        <p className="text-zinc-300">채널: {state.channel}</p>
        <p className="text-zinc-300">누적 메시지: {state.messages.length}개</p>
      </section>
      <p className="text-xs text-zinc-500">
        실제 웹 푸시 운영 시에는 FCM + VAPID 키 + 서버 발송 로직을 연결하세요.
      </p>
    </main>
  );
}
