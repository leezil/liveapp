const truthy = (v: string | undefined) => v === "1" || v?.toLowerCase() === "true";

/** 개발 모드이거나 `NEXT_PUBLIC_DEBUG_LIVE=true`일 때 상세 로그 출력 */
export function isLiveDebugEnabled(): boolean {
  return process.env.NODE_ENV === "development" || truthy(process.env.NEXT_PUBLIC_DEBUG_LIVE);
}

export function liveDebug(tag: string, message: string, extra?: unknown): void {
  if (!isLiveDebugEnabled()) return;
  if (extra !== undefined) console.log(`[liveapp:${tag}]`, message, extra);
  else console.log(`[liveapp:${tag}]`, message);
}

export function liveDebugError(tag: string, message: string, error: unknown): void {
  if (!isLiveDebugEnabled()) return;
  console.error(`[liveapp:${tag}]`, message, toDebugErrorPayload(error));
}

export function agoraEnvSummary(): {
  appIdSet: boolean;
  appIdPrefix: string;
  channel: string;
  tokenSet: boolean;
} {
  const id = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";
  return {
    appIdSet: Boolean(id),
    appIdPrefix: id ? `${id.slice(0, 6)}…` : "(없음)",
    channel: process.env.NEXT_PUBLIC_AGORA_CHANNEL ?? "film-live-room",
    tokenSet: Boolean(process.env.NEXT_PUBLIC_AGORA_TOKEN?.trim()),
  };
}

export function toDebugErrorPayload(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const rec = error as Error & { code?: unknown; data?: unknown };
    return {
      name: error.name,
      message: error.message,
      code: rec.code,
      data: rec.data,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }
  if (error && typeof error === "object") {
    try {
      return JSON.parse(JSON.stringify(error)) as Record<string, unknown>;
    } catch {
      return { message: String(error) };
    }
  }
  return { message: String(error) };
}
