"use client";

import { useCallback, useEffect, useState } from "react";
import { registerPushWorker } from "@/lib/push";
import { urlBase64ToUint8Array } from "@/lib/webPushClient";

export function PushSubscribeCTA() {
  const [vapidReady, setVapidReady] = useState(false);
  const [subs, setSubs] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";

  useEffect(() => {
    setVapidReady(Boolean(vapidKey));
    void fetch("/api/push/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { subscribers?: number }) => setSubs(typeof j.subscribers === "number" ? j.subscribers : null))
      .catch(() => setSubs(null));
  }, [vapidKey]);

  const subscribe = useCallback(async () => {
    if (!vapidKey) {
      setStatus("VAPID 공개키가 없습니다. npm run gen:vapid 로 키를 만든 뒤 .env.local에 넣으세요.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("이 브라우저는 Web Push 구독을 지원하지 않습니다.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("알림 권한이 거부되었습니다.");
        return;
      }
      const reg = await registerPushWorker();
      if (!reg) {
        setStatus("서비스워커를 등록할 수 없습니다.");
        return;
      }
      const prev = await reg.pushManager.getSubscription();
      if (prev) await prev.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; subscribers?: number };
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSubs(typeof data.subscribers === "number" ? data.subscribers : null);
      setStatus("서버에 구독이 등록되었습니다. 관리자에서 「구독 기기에 푸시 발송」을 누르면 이 기기로도 옵니다.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "구독 실패");
    } finally {
      setBusy(false);
    }
  }, [vapidKey]);

  if (!vapidReady) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-xs text-amber-100">
        <p className="font-semibold text-amber-200">원격 푸시(VAPID)</p>
        <p className="mt-1 text-amber-100/90">
          터미널에서 <code className="rounded bg-black/40 px-1">npm run gen:vapid</code> 실행 후, 출력된 키를{" "}
          <code className="rounded bg-black/40 px-1">.env.local</code>에 넣고 개발 서버를 재시작하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-3 text-sm text-zinc-200">
      <p className="font-semibold text-white">다른 기기에서 보낸 알림 받기 (Web Push)</p>
      <p className="mt-1 text-xs text-zinc-400">
        홈 화면 앱 또는 HTTPS에서, 아래 버튼으로 구독하면 관리자의「구독 기기에 푸시 발송」이 이 기기로도
        전달됩니다.
        {subs !== null ? (
          <span className="mt-1 block text-emerald-400">현재 서버에 등록된 구독: {subs}개 (이 인스턴스 기준)</span>
        ) : null}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void subscribe()}
        className="mt-2 w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "처리 중…" : "알림 구독 등록"}
      </button>
      {status ? <p className="mt-2 text-xs text-zinc-300">{status}</p> : null}
    </div>
  );
}
