/** 한 줄당 한 메시지. `닉네임|내용` 또는 `닉네임: 내용` (첫 `:` 기준). 구분자 없으면 작성자는 fan */
export function parseScriptChatLines(raw: string): Array<{ author: string; text: string }> {
  const out: Array<{ author: string; text: string }> = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const pipe = t.indexOf("|");
    if (pipe > 0) {
      out.push({ author: t.slice(0, pipe).trim() || "fan", text: t.slice(pipe + 1).trim() });
      continue;
    }
    const colon = t.indexOf(":");
    if (colon > 0) {
      out.push({ author: t.slice(0, colon).trim() || "fan", text: t.slice(colon + 1).trim() });
      continue;
    }
    out.push({ author: "fan", text: t });
  }
  return out;
}
