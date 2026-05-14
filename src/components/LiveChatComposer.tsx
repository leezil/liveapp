"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const NICK_KEY = "liveapp-chat-nick";

type Props = {
  onSent?: () => void;
  onToggleFullscreen?: () => void;
  fullscreenActive?: boolean;
};

export function LiveChatComposer({ onSent, onToggleFullscreen, fullscreenActive }: Props) {
  const [nick, setNick] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(NICK_KEY) : null;
    setNick(saved?.trim() || "시청자");
  }, []);

  const persistNick = useCallback((v: string) => {
    const t = v.trim() || "시청자";
    setNick(t);
    try {
      localStorage.setItem(NICK_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setHint("");
    try {
      const res = await fetch("/api/live/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          author: nick.trim() || "시청자",
          text: body,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setText("");
      onSent?.();
    } catch (e) {
      setHint(e instanceof Error ? e.message : "전송 실패");
    } finally {
      setBusy(false);
    }
  }, [busy, nick, onSent, text]);

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/55 px-2 py-2 backdrop-blur-md"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-end gap-2">
        <Link
          href="/"
          className="mb-1.5 shrink-0 rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-medium text-white active:bg-white/20"
        >
          나가기
        </Link>
        {onToggleFullscreen ? (
          <button
            type="button"
            onClick={() => void onToggleFullscreen()}
            className="mb-1.5 shrink-0 rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-medium text-white active:bg-white/20"
            title="전체화면"
          >
            {fullscreenActive ? "창" : "⛶"}
          </button>
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            onBlur={() => persistNick(nick)}
            maxLength={24}
            className="w-full rounded-md border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] text-white placeholder:text-zinc-500"
            placeholder="닉네임"
            aria-label="닉네임"
          />
          <div className="flex gap-1.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              maxLength={500}
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
              placeholder="메시지 입력…"
              aria-label="채팅 메시지"
            />
            <button
              type="button"
              disabled={busy || !text.trim()}
              onClick={() => void send()}
              className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              전송
            </button>
          </div>
        </div>
      </div>
      {hint ? <p className="mt-1 text-center text-[11px] text-rose-300">{hint}</p> : null}
    </div>
  );
}
