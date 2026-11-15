"use client";

// 功能：把 ```mermaid 區塊畫成圖表。Mermaid 程式只在這個元件掛上頁面後才動態載入，
// 所以內容裡沒有 mermaid 區塊的頁面不會下載它。載入前、沒有 JavaScript 或語法錯誤時，讀者看到的是原始碼。

import { useEffect, useId, useState } from "react";

import {
  MERMAID_ERROR_MESSAGE,
  renderMermaidDiagram,
  toMermaidElementId,
  type MermaidRenderResult,
} from "../lib/markdown/mermaid.ts";

type DiagramState = { status: "loading" } | MermaidRenderResult;

export function MermaidDiagram({ source }: { source: string }) {
  const id = toMermaidElementId(useId());
  const [state, setState] = useState<DiagramState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    renderMermaidDiagram({
      id,
      loadMermaid: () => import("mermaid").then((mermaidModule) => mermaidModule.default),
      source,
    }).then((result) => {
      // 內容在繪製途中改變（例如後台預覽重新整理）時，丟掉舊的結果。
      if (!cancelled) {
        setState(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id, source]);

  if (state.status === "ready") {
    // SVG 由 Mermaid 在 strict 安全等級下產生並清理過。not-prose：圖表內的文字不套長文樣式，避免標籤跑版。
    return <div className="not-prose my-8 overflow-x-auto" dangerouslySetInnerHTML={{ __html: state.svg }} />;
  }

  return (
    <div>
      {state.status === "error" ? <p>{MERMAID_ERROR_MESSAGE}</p> : null}
      <pre>
        <code className="language-mermaid">{source}</code>
      </pre>
    </div>
  );
}
