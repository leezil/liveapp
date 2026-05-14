"use client";

import { useEffect, useState } from "react";

/** PWA / 홈 화면 추가 후 실행 시 브라우저 주소창 없이 뜨는 모드 */
export function useStandaloneDisplay() {
  const [standalone, setStandalone] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const run = () => {
      const nav = window.navigator as Navigator & { standalone?: boolean };
      const dm =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches;
      setStandalone(Boolean(dm || nav.standalone));
      setChecked(true);
    };
    run();
    const mq1 = window.matchMedia("(display-mode: standalone)");
    const mq2 = window.matchMedia("(display-mode: fullscreen)");
    const onChange = () => run();
    mq1.addEventListener("change", onChange);
    mq2.addEventListener("change", onChange);
    return () => {
      mq1.removeEventListener("change", onChange);
      mq2.removeEventListener("change", onChange);
    };
  }, []);

  return { standalone, checked };
}
