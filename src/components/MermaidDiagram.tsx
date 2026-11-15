"use client";

// 功能：把 ```mermaid 區塊畫成圖表。Mermaid 程式只在這個元件掛上頁面後才動態載入，
// 所以內容裡沒有 mermaid 區塊的頁面不會下載它。載入前、沒有 JavaScript 或語法錯誤時，讀者看到的是原始碼。

import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";

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
  // React 19 只要 dangerouslySetInnerHTML 的物件換了就會重設 innerHTML；跟著結果記住同一個物件，
  // 外層重新輸出（例如後台即時預覽）時，沒變的圖表不會被重新放一次。
  const svgMarkup = useMemo(() => (state.status === "ready" ? { __html: state.svg } : null), [state]);

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

  if (svgMarkup && state.status === "ready") {
    // SVG 由 Mermaid 在 strict 安全等級下產生並清理過。not-prose：圖表內的文字不套長文樣式，避免標籤跑版。
    // 圖表的最小寬度（原尺寸的 80%，最多 45rem）由 globals.css 的 .mermaid-diagram > svg 讀取；欄寬比它窄時在容器內左右捲動。
    const minWidthStyle = state.minWidth
      ? ({ "--mermaid-svg-min-width": `${state.minWidth}px` } as CSSProperties)
      : undefined;

    return (
      <div
        className="mermaid-diagram not-prose my-8 overflow-x-auto"
        dangerouslySetInnerHTML={svgMarkup}
        style={minWidthStyle}
      />
    );
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
