"use client";

import { useEffect, useState } from "react";
import { liveDebug, liveDebugError } from "@/lib/debugLive";
import { parseScriptChatLines } from "@/lib/scriptChatParse";
import { showLocalPush } from "@/lib/push";

const DEFAULT_SCRIPT_TEXT = `movie_fan01|와 화면 분위기 진짜 좋다
nightowl: 지금 장소 어디예요?
cinema_park|채팅 속도 미쳤다 ㄷㄷ
hello_j: 소리 잘 들려요!
runrun|좋아요 눌렀어요`;

async function postControl(body: Record<string, unknown>) {
  liveDebug("admin", "control 요청", body);
  const res = await fetch("/api/live/control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? (JSON.parse(text) as unknown) : {};
  } catch {
    parsed = { raw: text };
  }
  liveDebug("admin", "control 응답", { status: res.status, ok: res.ok, body: parsed });
  if (!res.ok) {
    const errMsg =
      typeof parsed === "object" && parsed !== null && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(errMsg);
  }
}

export function AdminPanel() {
  const [title, setTitle] = useState("오늘의 라이브");
  const [status, setStatus] = useState("");

  const [pushTitle, setPushTitle] = useState("Live 알림");
  const [pushBody, setPushBody] = useState("");
  const [pushPin, setPushPin] = useState("");
  const [pushSubs, setPushSubs] = useState<number | null>(null);
  const [pinRequired, setPinRequired] = useState(false);
  const [vapidConfigured, setVapidConfigured] = useState(false);

  const [scriptDelayMs, setScriptDelayMs] = useState(900);
  const [scriptMaxCount, setScriptMaxCount] = useState(0);
  const [scriptText, setScriptText] = useState(DEFAULT_SCRIPT_TEXT);

  useEffect(() => {
    void fetch("/api/push/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { subscribers?: number; pinRequired?: boolean; configured?: boolean }) => {
        setPushSubs(typeof d.subscribers === "number" ? d.subscribers : null);
        setPinRequired(Boolean(d.pinRequired));
        setVapidConfigured(Boolean(d.configured));
      })
      .catch(() => {});
  }, []);

  const startLive = async () => {
    try {
      await postControl({ action: "start", title });
      setStatus("라이브 상태를 시작으로 전환했습니다.");
    } catch (e) {
      liveDebugError("admin", "라이브 시작 요청 실패", e);
      setStatus(e instanceof Error ? `실패: ${e.message}` : "요청 실패");
    }
  };

  const stopLive = async () => {
    try {
      await postControl({ action: "stop" });
      setStatus("라이브 상태를 종료로 전환했습니다.");
    } catch (e) {
      liveDebugError("admin", "라이브 종료 요청 실패", e);
      setStatus(e instanceof Error ? `실패: ${e.message}` : "요청 실패");
    }
  };

  const runScript = async () => {
    const parsed = parseScriptChatLines(scriptText);
    if (!parsed.length) {
      setStatus("스크립트 내용이 비어 있습니다. 한 줄에 한 메시지를 적어 주세요.");
      return;
    }
    try {
      await postControl({
        action: "script",
        intervalMs: scriptDelayMs,
        ...(scriptMaxCount > 0 ? { maxMessages: scriptMaxCount } : {}),
        script: parsed,
      });
      const cap = scriptMaxCount > 0 ? Math.min(scriptMaxCount, parsed.length) : parsed.length;
      setStatus(`채팅 스크립트 실행: ${cap}개, 간격 ${scriptDelayMs}ms`);
    } catch (e) {
      liveDebugError("admin", "스크립트 요청 실패", e);
      setStatus(e instanceof Error ? `실패: ${e.message}` : "요청 실패");
    }
  };

  const sendPush = async () => {
    const ok = await showLocalPush("라이브 시작!", `${title} 방송이 시작되었습니다.`);
    setStatus(
      ok
        ? "기기 알림을 보냈습니다. (권한이 허용된 경우)"
        : "알림이 막혔습니다. 브라우저에서 알림을 허용했는지, HTTPS인지 확인하세요.",
    );
  };

  const sendServerPush = async () => {
    if (!vapidConfigured) {
      setStatus("VAPID가 설정되지 않았습니다. npm run gen:vapid 후 .env.local을 채우세요.");
      return;
    }
    if (pinRequired && !pushPin.trim()) {
      setStatus("서버에 CREW_PUSH_PIN이 설정되어 있습니다. PIN을 입력하세요.");
      return;
    }
    try {
      const res = await fetch("/api/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pushTitle.trim() || "Live 알림",
          body: pushBody.trim() || `${title} 방송 알림`,
          ...(pushPin.trim() ? { pin: pushPin.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; sent?: number; failed?: number; removed?: number };
      if (!res.ok) throw new Error(data.error ?? String(res.status));
      setStatus(
        `서버 Web Push: 성공 ${data.sent ?? 0}건, 실패 ${data.failed ?? 0}건, 만료 구독 제거 ${data.removed ?? 0}건`,
      );
      const st = await fetch("/api/push/status", { cache: "no-store" }).then((r) => r.json());
      setPushSubs(typeof st.subscribers === "number" ? st.subscribers : null);
    } catch (e) {
      liveDebugError("admin", "서버 푸시 실패", e);
      setStatus(e instanceof Error ? `서버 푸시 실패: ${e.message}` : "서버 푸시 실패");
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-white">
      <h2 className="text-lg font-semibold">관리자 연출 패널</h2>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        placeholder="라이브 제목"
      />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button type="button" onClick={startLive} className="rounded-lg bg-emerald-500 px-3 py-2 font-semibold">
          라이브 시작 상태
        </button>
        <button type="button" onClick={stopLive} className="rounded-lg bg-zinc-700 px-3 py-2 font-semibold">
          라이브 종료 상태
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
        <p className="text-sm font-semibold text-zinc-200">채팅 쏟아지기</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-zinc-400">
            딜레이 (ms)
            <input
              type="number"
              min={150}
              max={60000}
              step={50}
              value={scriptDelayMs}
              onChange={(e) => setScriptDelayMs(Number(e.target.value) || 900)}
              className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-400">
            보낼 개수 (0 = 전체 줄)
            <input
              type="number"
              min={0}
              max={200}
              value={scriptMaxCount}
              onChange={(e) => setScriptMaxCount(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <label className="block text-xs text-zinc-400">
          내용 (줄마다 한 메시지 · <code className="text-emerald-400">닉|내용</code> 또는{" "}
          <code className="text-emerald-400">닉: 내용</code>)
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={8}
            className="mt-1 w-full resize-y rounded-lg border border-zinc-600 bg-zinc-950 px-2 py-2 font-mono text-[12px] leading-relaxed"
          />
        </label>
        <button type="button" onClick={runScript} className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold">
          채팅 쏟아지기 실행
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
        <p className="text-sm font-semibold text-zinc-200">푸시 알림</p>
        <p className="text-[11px] text-zinc-500">
          <strong className="text-zinc-300">이 기기만</strong> 즉시 띄우기(로컬) /{" "}
          <strong className="text-zinc-300">구독 등록된 모든 기기</strong>로 보내기(Web Push, 서버)
        </p>
        {pushSubs !== null ? (
          <p className="text-[11px] text-emerald-400">현재 서버 구독 수(이 서버 인스턴스): {pushSubs}개</p>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={sendPush}
            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black"
          >
            이 기기에만 (로컬)
          </button>
          <button
            type="button"
            onClick={() => void sendServerPush()}
            disabled={!vapidConfigured}
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            구독 기기에 발송
          </button>
        </div>
        <label className="block text-xs text-zinc-400">
          알림 제목
          <input
            value={pushTitle}
            onChange={(e) => setPushTitle(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs text-zinc-400">
          알림 본문 (비우면 라이브 제목 기반)
          <input
            value={pushBody}
            onChange={(e) => setPushBody(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-sm"
            placeholder={`예: ${title} 방송이 곧 시작됩니다`}
          />
        </label>
        {pinRequired ? (
          <label className="block text-xs text-amber-300">
            발송 PIN (서버 CREW_PUSH_PIN과 동일)
            <input
              type="password"
              value={pushPin}
              onChange={(e) => setPushPin(e.target.value)}
              className="mt-1 w-full rounded border border-amber-700/50 bg-zinc-950 px-2 py-1.5 text-sm"
              autoComplete="off"
            />
          </label>
        ) : null}
        <p className="text-[11px] leading-snug text-zinc-500">
          Web Push는 홈에서「알림 구독 등록」을 한 기기로 전달됩니다. Vercel 등 서버가 여러 개면 구독이 나뉘어
          일부만 받을 수 있어요. 운영 시 Redis 등 공유 저장소로 구독 목록을 옮기면 안정적입니다.
        </p>
      </div>

      {status && <p className="text-xs text-zinc-300">{status}</p>}
    </section>
  );
}
