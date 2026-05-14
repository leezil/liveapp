"use client";

import { useEffect, useMemo, useState } from "react";
import { liveDebug, liveDebugError } from "@/lib/debugLive";
import type { LiveEvent, LiveMessage, LiveState } from "@/types/live";

const initialState: LiveState = {
  isLive: false,
  title: "오늘의 라이브",
  channel: "film-live-room",
  startedAt: null,
  messages: [],
};

export function useLiveFeed() {
  const [state, setState] = useState<LiveState>(initialState);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = "/api/live/stream";
    liveDebug("sse", "EventSource 연결", { url });
    const source = new EventSource(url);

    source.onopen = () => {
      liveDebug("sse", "open", { readyState: source.readyState });
      setConnected(true);
    };
    source.onerror = () => {
      liveDebug("sse", "error", {
        readyState: source.readyState,
        hint:
          source.readyState === EventSource.CLOSED
            ? "연결 종료됨 — 네트워크/서버리스 인스턴스 불일치 가능"
            : "재연결 시도 중일 수 있음",
      });
      setConnected(false);
    };
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as LiveEvent;
        liveDebug("sse", "message", { type: parsed.type });
        if (parsed.type === "state") {
          setState(parsed.payload);
        }
        if (parsed.type === "message") {
          setState((prev) => ({ ...prev, messages: [...prev.messages, parsed.payload] }));
        }
      } catch (e) {
        liveDebugError("sse", "이벤트 JSON 파싱 실패", e);
      }
    };

    return () => {
      liveDebug("sse", "EventSource close");
      source.close();
    };
  }, []);

  const latestMessages: LiveMessage[] = useMemo(() => state.messages.slice(-30), [state.messages]);

  return { state, connected, latestMessages };
}
