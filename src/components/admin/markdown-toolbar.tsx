"use client";

// 功能：後台 Markdown 內容欄位上方的工具列。每個按鈕把對應的 Markdown 語法插入內容欄位；
// 實際的編輯規則在 src/lib/markdown/toolbar-actions.ts。按鈕都是 type="button"，不會送出表單。
// 鍵盤：Tab 進入工具列後，用左右方向鍵、Home、End 在按鈕之間移動（role="toolbar" 的標準操作方式）。

import { useRef, useState, type KeyboardEvent } from "react";

import type { TextEditState } from "../../lib/markdown/text-edits.ts";
import {
  insertCodeBlock,
  insertLink,
  insertMermaid,
  insertTable,
  toggleBulletList,
  toggleHeading,
  toggleNumberedList,
  toggleQuote,
  wrapBold,
  wrapItalic,
} from "../../lib/markdown/toolbar-actions.ts";

type ToolbarAction = {
  // 編輯規則；圖片按鈕沒有，它只把焦點移到上傳區塊。
  edit?: (state: TextEditState) => TextEditState;
  label: string;
  title: string;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { edit: wrapBold, label: "粗體", title: "粗體（Cmd/Ctrl+B）" },
  { edit: wrapItalic, label: "斜體", title: "斜體（Cmd/Ctrl+I）" },
  { edit: (state) => toggleHeading(state, 2), label: "大標", title: "大標（## ）" },
  { edit: (state) => toggleHeading(state, 3), label: "小標", title: "小標（### ）" },
  { edit: insertLink, label: "連結", title: "連結（Cmd/Ctrl+K）" },
  { edit: toggleQuote, label: "引言", title: "引言（> ）" },
  { edit: toggleBulletList, label: "項目清單", title: "項目清單（- ）" },
  { edit: toggleNumberedList, label: "編號清單", title: "編號清單（1. ）" },
  { edit: insertTable, label: "表格", title: "插入兩欄的範例表格" },
  { edit: insertCodeBlock, label: "程式碼區塊", title: "插入程式碼區塊" },
  { edit: insertMermaid, label: "Mermaid 圖表", title: "插入 Mermaid 流程圖範例" },
  { label: "圖片", title: "到下方「上傳圖片」選擇檔案" },
];

export function MarkdownToolbar({
  controls,
  disabled,
  onEdit,
  onImage,
}: {
  // 工具列作用的 textarea id。
  controls: string;
  disabled: boolean;
  onEdit: (edit: (state: TextEditState) => TextEditState) => void;
  onImage: () => void;
}) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const lastIndex = TOOLBAR_ACTIONS.length - 1;
    const nextIndex: Record<string, number> = {
      ArrowLeft: activeIndex === 0 ? lastIndex : activeIndex - 1,
      ArrowRight: activeIndex === lastIndex ? 0 : activeIndex + 1,
      End: lastIndex,
      Home: 0,
    };

    if (!(event.key in nextIndex)) {
      return;
    }

    event.preventDefault();
    setActiveIndex(nextIndex[event.key]);
    buttonRefs.current[nextIndex[event.key]]?.focus();
  }

  return (
    <div
      aria-controls={controls}
      aria-label="Markdown 工具列"
      className="flex flex-wrap gap-1.5"
      onKeyDown={handleKeyDown}
      role="toolbar"
    >
      {TOOLBAR_ACTIONS.map((action, index) => (
        <button
          className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black transition hover:border-black/25 hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          key={action.label}
          onClick={() => (action.edit ? onEdit(action.edit) : onImage())}
          onFocus={() => setActiveIndex(index)}
          // 用滑鼠點按鈕時不搶走內容欄位的焦點，選取範圍才不會跑掉。
          onMouseDown={(event) => event.preventDefault()}
          ref={(element) => {
            buttonRefs.current[index] = element;
          }}
          tabIndex={index === activeIndex ? 0 : -1}
          title={action.title}
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
