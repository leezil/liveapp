"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveMessage } from "@/types/live";
import { LiveChatOverlay } from "@/components/LiveChatOverlay";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";
import { useStandaloneDisplay } from "@/hooks/useStandaloneDisplay";

type Props = {
  title: string;
  isLive: boolean;
  connected: boolean;
  messages: LiveMessage[];
  /** 송출 화면은 하단 버튼 위로 채팅이 오도록 여백을 더 둠 */
  chatReserveBottom?: "watch" | "broadcast";
  children: React.ReactNode;
};

const HINT_KEY = "liveapp-add-home-hint";

export function LiveImmersiveShell({
  title,
  isLive,
  connected,
  messages,
  chatReserveBottom = "watch",
  children,
}: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [fsActive, setFsActive] = useState(false);
  const { standalone, checked } = useStandaloneDisplay();
  const { canUseInstallPrompt, runInstall } = usePwaInstallPrompt();
  const [hintDismissed, setHintDismissed] = useState(true);
  const [clientHints, setClientHints] = useState({
    isMobile: false,
    isChrome: false,
    isAndroid: false,
  });

  useEffect(() => {
    setHintDismissed(sessionStorage.getItem(HINT_KEY) === "1");
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isChrome = /Chrome/i.test(ua) && !/Edg|OPR/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const mq = window.matchMedia("(max-width: 640px), (pointer: coarse)");
    const sync = () =>
      setClientHints({
        isMobile: mq.matches,
        isChrome,
        isAndroid,
      });
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const sync = () => {
      const el = rootRef.current;
      setFsActive(Boolean(el && document.fullscreenElement === el));
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* iOS 인앱·일부 브라우저는 미지원 */
    }
  }, []);

  const dismissHint = useCallback(() => {
    sessionStorage.setItem(HINT_KEY, "1");
    setHintDismissed(true);
  }, []);

  const showAddHomeHint =
    checked &&
    !standalone &&
    !hintDismissed &&
    (clientHints.isMobile || clientHints.isChrome || canUseInstallPrompt);

  const bottomReserveClass =
    chatReserveBottom === "broadcast"
      ? "pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))]"
      : "pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))]";

  return (
    <main
      ref={rootRef}
      className="flex h-[100dvh] max-h-[100dvh] w-full touch-manipulation flex-col overflow-hidden bg-black text-white"
    >
      <header
        className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-sm"
        style={{
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${isLive ? "animate-pulse bg-red-500" : "bg-zinc-600"}`}
              aria-hidden
            />
            <p className="truncate font-semibold">{title}</p>
          </div>
          <p className="truncate text-[11px] text-zinc-400">
            {connected ? "채팅·상태 연결됨" : "채팅 연결 재시도 중…"}
            {standalone ? " · 홈 화면 앱 모드" : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white active:bg-white/20"
              title="브라우저가 지원할 때만 주소창·탭을 잠시 숨깁니다"
            >
              {fsActive ? "전체화면 끝" : "전체화면"}
            </button>
            <Link
              href="/"
              className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white active:bg-white/20"
            >
              나가기
            </Link>
          </div>
          <span className="max-w-[12rem] text-right text-[9px] leading-tight text-zinc-500">
            크롬은 메뉴에「앱 설치」로 보일 때가 많아요
          </span>
        </div>
      </header>

      {showAddHomeHint && (
        <div className="shrink-0 border-b border-amber-500/25 bg-amber-950/50 px-3 py-2.5 text-[11px] leading-snug text-amber-50">
          <p className="font-semibold text-amber-200">앱처럼 (주소창·탭 줄이기)</p>

          {canUseInstallPrompt && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void runInstall()}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow active:bg-emerald-500"
              >
                앱으로 설치
              </button>
              <span className="text-[10px] text-amber-200/90">크롬이 띄워 준 설치 창입니다. 눌러 진행하세요.</span>
            </div>
          )}

          <p className="mt-2 text-amber-100/95">
            <strong className="text-white">크롬 (안드로이드)</strong>: 우측 상단 <strong>⋮</strong> → 메뉴{" "}
            <strong>맨 위쪽</strong>에 있는 <strong>「앱 설치」</strong> 또는 <strong>「Live App Demo 설치」</strong>
            를 찾아보세요. (옛날 이름인 <strong>「홈 화면에 추가」</strong>는 최근 버전에서 안 보일 수 있습니다.) 주소창
            오른쪽에 <strong>설치(⊕)</strong> 아이콘이 있으면 그걸 눌러도 됩니다.
          </p>
          <p className="mt-1.5 text-amber-100/95">
            <strong className="text-white">크롬 (Windows/Mac)</strong>: <strong>⋮</strong> →{" "}
            <strong>「앱 설치」</strong> 또는 <strong>「저장 및 공유」</strong> →{" "}
            <strong>「페이지를 바로가기로 만들기…」</strong> (창이 따로 뜨며, 완전한 전체화면은 앱 설치에 더 가깝습니다.)
          </p>
          <p className="mt-1.5 text-amber-100/95">
            <strong className="text-white">Safari (아이폰)</strong>: 공유(□↑) → <strong>홈 화면에 추가</strong> →
            바탕화면 아이콘으로 실행.
          </p>
          <p className="mt-1.5 text-[10px] text-amber-200/80">
            「전체화면」버튼은 브라우저가 허용하는 범위에서만 UI를 접습니다. 주소창을 없애려면 위처럼{" "}
            <strong>앱 설치</strong> 또는 <strong>홈 화면 바로가기</strong>가 가장 확실합니다.
          </p>
          <button
            type="button"
            onClick={dismissHint}
            className="mt-2 text-[11px] font-medium text-amber-300 underline underline-offset-2"
          >
            안내 닫기 (다시 보지 않음)
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {children}
        <LiveChatOverlay messages={messages} bottomReserveClass={bottomReserveClass} />
      </div>
    </main>
  );
}
