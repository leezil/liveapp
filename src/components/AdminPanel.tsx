"use client";

import { useState } from "react";
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

  const [scriptDelayMs, setScriptDelayMs] = useState(900);
  const [scriptMaxCount, setScriptMaxCount] = useState(0);
  const [scriptText, setScriptText] = useState(DEFAULT_SCRIPT_TEXT);

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
        <p className="text-sm font-semibold text-zinc-200">푸시 알림 (로컬)</p>
        <button
          type="button"
          onClick={sendPush}
          className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-black"
        >
          푸시 알림 보내기
        </button>
        <p className="text-[11px] leading-snug text-zinc-500">
          안드로이드 크롬: 사이트 알림을 <strong className="text-zinc-300">허용</strong>한 뒤 버튼을 누르면 상단/알림
          센터에 뜹니다. iOS Safari는 제한이 많고, <strong className="text-zinc-300">홈 화면에 추가한 웹앱</strong>에서
          알림을 켠 경우에만 안정적인 편입니다. (서버에서 보내는 FCM/Web Push는 별도 연동이 필요합니다.)
        </p>
      </div>

      {status && <p className="text-xs text-zinc-300">{status}</p>}
    </section>
  );
}
