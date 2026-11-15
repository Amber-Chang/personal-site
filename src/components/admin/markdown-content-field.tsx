"use client";

// 功能：文章與專案表單共用的 Markdown 內容欄位：textarea 加上旁邊的「上傳圖片」區塊。
// textarea 維持原本的 id、name 與 defaultValue，跟著表單送出，資料格式不變。
// 上傳成功的圖片語法只會插入這個欄位（專案表單的摘要、成果等欄位不受影響）。

import { useRef } from "react";

import { insertImageMarkdown } from "../../lib/content-images/image-markdown.ts";
import { ContentImageUpload } from "./content-image-upload.tsx";
import { applyTextareaEdit } from "./textarea-edit.ts";

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
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-black" htmlFor={input.id}>
        {input.label}
      </label>
      <p className="text-xs leading-5 text-black/55">{input.description}</p>
      <textarea
        className={input.textareaClassName}
        defaultValue={input.defaultValue}
        id={input.id}
        name={input.name}
        onFocus={() => {
          cursorPlacedRef.current = true;
        }}
        ref={textareaRef}
      />
      <ContentImageUpload disabled={input.disabled} onUploaded={insertImage} />
    </div>
  );
}
