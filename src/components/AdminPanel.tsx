"use client";

import { useState } from "react";
import { liveDebug, liveDebugError } from "@/lib/debugLive";
import { showLocalPush } from "@/lib/push";

async function control(action: "start" | "stop" | "script", title?: string) {
  liveDebug("admin", "control 요청", { action, title });
  const res = await fetch("/api/live/control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, title }),
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? (JSON.parse(text) as unknown) : {};
  } catch {
    body = { raw: text };
  }
  liveDebug("admin", "control 응답", { status: res.status, ok: res.ok, body });
  if (!res.ok) {
    const errMsg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
}

export function AdminPanel() {
  const [title, setTitle] = useState("오늘의 라이브");
  const [status, setStatus] = useState("");

  const startLive = async () => {
    try {
      await control("start", title);
      setStatus("라이브 상태를 시작으로 전환했습니다.");
    } catch (e) {
      liveDebugError("admin", "라이브 시작 요청 실패", e);
      setStatus(e instanceof Error ? `실패: ${e.message}` : "요청 실패");
    }
  };

  const stopLive = async () => {
    try {
      await control("stop");
      setStatus("라이브 상태를 종료로 전환했습니다.");
    } catch (e) {
      liveDebugError("admin", "라이브 종료 요청 실패", e);
      setStatus(e instanceof Error ? `실패: ${e.message}` : "요청 실패");
    }
  };

  const runScript = async () => {
    try {
      await control("script");
      setStatus("사전 채팅 스크립트를 실행했습니다.");
    } catch (e) {
      liveDebugError("admin", "스크립트 요청 실패", e);
      setStatus(e instanceof Error ? `실패: ${e.message}` : "요청 실패");
    }
  };

  const sendPush = async () => {
    const ok = await showLocalPush("라이브 시작!", `${title} 방송이 시작되었습니다.`);
    setStatus(ok ? "브라우저 푸시를 전송했습니다." : "푸시 권한 또는 서비스워커 상태를 확인하세요.");
  };

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-white">
      <h2 className="text-lg font-semibold">관리자 연출 패널</h2>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        placeholder="라이브 제목"
      />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button onClick={startLive} className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold">
          라이브 시작 상태
        </button>
        <button onClick={stopLive} className="rounded-lg bg-zinc-700 px-3 py-2 font-semibold">
          라이브 종료 상태
        </button>
        <button onClick={runScript} className="rounded-lg bg-indigo-500 px-3 py-2 font-semibold">
          채팅 쏟아지기
        </button>
        <button onClick={sendPush} className="rounded-lg bg-amber-500 px-3 py-2 font-semibold text-black">
          푸시 알림 보내기
        </button>
      </div>
      {status && <p className="text-xs text-zinc-300">{status}</p>}
    </section>
  );
}
