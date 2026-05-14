"use client";

import { useEffect } from "react";

/** Chrome PWA 설치 조건 충족에 도움이 되도록 sw.js를 조용히 등록 */
export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
