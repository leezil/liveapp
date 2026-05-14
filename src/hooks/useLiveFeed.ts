"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isLiveDebugEnabled, liveDebug, liveDebugError } from "@/lib/debugLive";
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
  const refetchRef = useRef<() => void>(() => {});

  const fetchState = useCallback(async () => {
    try {
      const r = await fetch("/api/live/state", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const next = (await r.json()) as LiveState;
      setState(next);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    refetchRef.current = () => void fetchState();
  }, [fetchState]);

  useEffect(() => {
    void fetchState();
    const pollId = setInterval(() => void fetchState(), 1200);

    const url = "/api/live/stream";
    if (isLiveDebugEnabled()) liveDebug("sse", "EventSource 연결", { url });
    const source = new EventSource(url);

    source.onopen = () => {
      if (isLiveDebugEnabled()) liveDebug("sse", "open");
      setConnected(true);
    };
    source.onerror = () => {
      if (isLiveDebugEnabled()) liveDebug("sse", "error (폴링으로 상태 유지)");
    };
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as LiveEvent;
        if (parsed.type === "state") {
          setState(parsed.payload);
        }
        if (parsed.type === "message") {
          const msg = parsed.payload as LiveMessage;
          setState((prev) => {
            if (prev.messages.some((m) => m.id === msg.id)) return prev;
            return { ...prev, messages: [...prev.messages, msg] };
          });
        }
      } catch (e) {
        liveDebugError("sse", "이벤트 파싱 실패", e);
      }
    };

    return () => {
      clearInterval(pollId);
      source.close();
    };
  }, [fetchState]);

  const latestMessages: LiveMessage[] = useMemo(() => state.messages.slice(-30), [state.messages]);

  return { state, connected, latestMessages, refetch: () => void refetchRef.current() };
}
