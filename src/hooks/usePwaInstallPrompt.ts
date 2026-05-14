"use client";

import { useCallback, useEffect, useState } from "react";

type DeferredInstall = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function usePwaInstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredInstall | null>(null);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as DeferredInstall);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const runInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
  }, [deferred]);

  return { canUseInstallPrompt: Boolean(deferred), runInstall };
}