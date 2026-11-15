// 功能：文章、案例內頁與後台預覽共用的 Markdown 輸出設定（外掛與元件替換）。
// MarkdownContent 用這份設定輸出；測試也用同一份，確保測到的就是前台實際用的設定。
// 這個檔案不能用 JSX（測試直接載入 .ts 檔），元件一律用 createElement 建立。

import { createElement, type ComponentProps, type ComponentType } from "react";
import type { Element, ElementContent } from "hast";
import type { Components, ExtraProps, Options } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

// GFM：表格、刪除線、待辦清單、網址自動連結、註腳。
// 刪除線只認兩個波浪號（~~文字~~），因為中文常用單一「~」表示範圍，例如「3~5 天」。
export const remarkPlugins: Options["remarkPlugins"] = [[remarkGfm, { singleTilde: false }]];

// 程式碼上色在輸出 HTML 時完成（前台在伺服器端執行），讀者端不需要額外 JavaScript。
// 只上色有標語言的區塊；沒標或不認得的語言照原樣輸出。mermaid 區塊不上色，交給圖表元件處理。
export const rehypePlugins: Options["rehypePlugins"] = [[rehypeHighlight, { plainText: ["mermaid"] }]];

// react-markdown 會把語法樹節點 node 傳給替換元件；它不是 HTML 屬性，輸出前要拿掉。
function withoutNode<TProps extends ExtraProps>(props: TProps): Omit<TProps, "node"> {
  const rest = { ...props };
  delete rest.node;
  return rest;
}

function toText(node: ElementContent): string {
  if (node.type === "text") {
    return node.value;
  }

  return node.type === "element" ? node.children.map(toText).join("") : "";
}

// 判斷 <pre> 是不是 ```mermaid 區塊；是的話回傳圖表原始碼（去掉 Markdown 補上的結尾換行），否則回傳 null。
export function getMermaidSource(node: Element | undefined): string | null {
  const code = node?.children.length === 1 ? node.children[0] : null;

  if (!code || code.type !== "element" || code.tagName !== "code") {
    return null;
  }

  const className = code.properties.className;

  if (!Array.isArray(className) || !className.includes("language-mermaid")) {
    return null;
  }

  return toText(code).replace(/\n$/, "");
}

// MermaidDiagram 由呼叫端傳入（MarkdownContent 傳真正的 client component，測試傳替身）。
export function createMarkdownComponents(input: { MermaidDiagram: ComponentType<{ source: string }> }): Components {
  return {
    // 圖片延後載入、非同步解碼，不擋住文字先出現。寬度上限由全站基礎樣式（max-width: 100%）控制。
    img: (props: ComponentProps<"img"> & ExtraProps) =>
      createElement("img", { ...withoutNode(props), decoding: "async", loading: "lazy" }),
    // ```mermaid 區塊交給圖表元件；其他程式碼區塊照常輸出 <pre>。
    pre: (props: ComponentProps<"pre"> & ExtraProps) => {
      const mermaidSource = getMermaidSource(props.node);

      if (mermaidSource !== null) {
        return createElement(input.MermaidDiagram, { source: mermaidSource });
      }

      return createElement("pre", withoutNode(props));
    },
    // 表格比內容欄寬時，在自己的容器內左右捲動，不撐出整頁的橫向捲軸。
    table: (props: ComponentProps<"table"> & ExtraProps) =>
      createElement("div", { className: "overflow-x-auto" }, createElement("table", withoutNode(props))),
  };
}
