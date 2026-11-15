"use client";

// 功能：文章與專案表單共用的 Markdown 內容欄位：textarea、編輯／預覽切換，以及旁邊的「上傳圖片」區塊。
// textarea 維持原本的 id、name 與 defaultValue，跟著表單送出，資料格式不變。
// 上傳成功的圖片語法只會插入這個欄位（專案表單的摘要、成果等欄位不受影響）。

import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import { insertImageMarkdown } from "../../lib/content-images/image-markdown.ts";
import { ContentImageUpload } from "./content-image-upload.tsx";
import { applyTextareaEdit } from "./textarea-edit.ts";

// 預覽第一次打開時才載入（含 Markdown 轉換與程式碼上色），平常編輯的頁面不必下載。
const MarkdownPreview = dynamic(() => import("./markdown-preview.tsx").then((module) => module.MarkdownPreview), {
  loading: () => <p className="text-sm text-black/55">預覽載入中...</p>,
  ssr: false,
});

const toggleButtonClassName =
  "rounded-full px-4 py-1.5 text-sm font-medium transition aria-pressed:bg-black aria-pressed:text-white text-black/65 hover:text-black";

export function MarkdownContentField(input: {
  defaultValue: string;
  description: string;
  // 表單送出中時停用上傳。
  disabled: boolean;
  id: string;
  label: string;
  name: string;
  textareaClassName: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 使用者點過內容欄位後才算有游標；之前插入的圖片會加在最後。
  const cursorPlacedRef = useRef(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewContent, setPreviewContent] = useState(input.defaultValue);

  function showPreview() {
    // 預覽的是 textarea 目前的文字（含尚未儲存的修改）；只讀，不改表單內容。
    setPreviewContent(textareaRef.current?.value ?? "");
    setMode("preview");
  }

  function insertImage(markdown: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const next = insertImageMarkdown(
      {
        hasCursor: cursorPlacedRef.current,
        selectionEnd: textarea.selectionEnd,
        selectionStart: textarea.selectionStart,
        value: textarea.value,
      },
      markdown,
    );

    applyTextareaEdit(textarea, next);
    cursorPlacedRef.current = true;
    // 在預覽狀態下上傳完成時，預覽跟著更新。
    setPreviewContent(textarea.value);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor={input.id}>
            {input.label}
          </label>
          <p className="text-xs leading-5 text-black/55">{input.description}</p>
        </div>
        <div aria-label="內容欄位檢視方式" className="flex gap-1 rounded-full border border-black/10 p-1" role="group">
          <button aria-pressed={mode === "edit"} className={toggleButtonClassName} onClick={() => setMode("edit")} type="button">
            編輯
          </button>
          <button aria-pressed={mode === "preview"} className={toggleButtonClassName} onClick={showPreview} type="button">
            預覽
          </button>
        </div>
      </div>
      {/* 預覽時 textarea 只隱藏不卸載：未儲存的文字、游標位置與表單送出的值都保留。 */}
      <textarea
        className={input.textareaClassName}
        defaultValue={input.defaultValue}
        hidden={mode === "preview"}
        id={input.id}
        name={input.name}
        onFocus={() => {
          cursorPlacedRef.current = true;
        }}
        ref={textareaRef}
      />
      {mode === "preview" ? (
        <div className="min-h-64 rounded-2xl border border-black/10 bg-white px-6 py-5">
          <MarkdownPreview content={previewContent} />
        </div>
      ) : null}
      <ContentImageUpload disabled={input.disabled} onUploaded={insertImage} />
    </div>
  );
}
