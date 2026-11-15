"use client";

// 功能：程式碼區塊標頭的「複製」按鈕。按下後從同一個區塊的 <pre><code> 讀出原始程式碼寫進剪貼簿，
// 不需要把程式碼再傳一份給瀏覽器；上色仍在伺服器端完成。結果約 2 秒後回到「複製」。

import { useEffect, useRef, useState } from "react";

import {
  CODE_COPY_FEEDBACK_MS,
  CODE_COPY_LABELS,
  copyCodeText,
  getCodeCopyText,
} from "../lib/markdown/code-copy.ts";

type CopyFeedback = { attempt: number; status: "idle" | "copied" | "failed" };

export function CodeCopyButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [feedback, setFeedback] = useState<CopyFeedback>({ attempt: 0, status: "idle" });

  useEffect(() => {
    if (feedback.status === "idle") {
      return;
    }

    // 每次按都重新計時。
    const timer = window.setTimeout(() => setFeedback((current) => ({ ...current, status: "idle" })), CODE_COPY_FEEDBACK_MS);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function handleCopy() {
    const code = buttonRef.current?.closest("[data-code-block]")?.querySelector("pre code");
    const status = await copyCodeText(getCodeCopyText(code?.textContent), navigator.clipboard);

    setFeedback((current) => ({ attempt: current.attempt + 1, status }));
  }

  return (
    <>
      {/* 可點範圍 44×44px；外觀與焦點框都在裡面較小的膠囊上。標頭用負邊距抵掉多出來的高度，不會蓋到程式碼。 */}
      <button
        className="group -my-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full outline-none"
        onClick={() => void handleCopy()}
        ref={buttonRef}
        type="button"
      >
        <span className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors group-hover:border-strong group-hover:text-foreground group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-foreground">
          {CODE_COPY_LABELS[feedback.status]}
        </span>
      </button>
      {/* 螢幕閱讀器念出結果。 */}
      <span aria-live="polite" className="sr-only">
        {feedback.status === "idle" ? "" : CODE_COPY_LABELS[feedback.status]}
      </span>
    </>
  );
}
