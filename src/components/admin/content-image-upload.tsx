"use client";

// 功能：後台內容欄位旁的「上傳圖片」區塊。選檔、填替代文字、按上傳：
// 先向本站要一次性上傳網址，再由瀏覽器直接把檔案傳到 Supabase，成功後把 ![替代文字](公開網址) 交給內容欄位插入。
// 這個區塊放在文章表單裡，所以欄位都不帶 name（不跟著表單送出），按鈕是 type="button"（不會觸發儲存）。

import { useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import {
  createImageMarkdown,
  getContentImageAltError,
  getContentImageFileError,
} from "../../lib/content-images/image-markdown.ts";
import { CONTENT_IMAGE_TYPES } from "../../lib/content-images/rules.ts";
import { requestContentImageUpload, uploadContentImage } from "../../lib/content-images/upload-client.ts";
import { uploadFileToSignedUrl } from "../../lib/infra/supabase/content-images-upload.ts";

type UploadMessage = { kind: "error" | "success"; text: string };

export function ContentImageUpload({
  disabled,
  fileInputId,
  onUploaded,
}: {
  disabled: boolean;
  // 選檔欄位的 id：工具列的「圖片」按鈕用它把焦點移過來。
  fileInputId: string;
  onUploaded: (markdown: string) => void;
}) {
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<UploadMessage | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    // 選到不允許的格式或超過 5MB 時，送出前就提示。
    const error = selected ? getContentImageFileError(selected) : null;

    setFile(selected);
    setMessage(error ? { kind: "error", text: error } : null);
  }

  async function handleUpload() {
    if (pending) {
      return;
    }

    const error = getContentImageFileError(file) ?? getContentImageAltError(alt);

    if (error || !file) {
      setMessage({ kind: "error", text: error ?? "" });
      return;
    }

    setPending(true);
    setMessage(null);

    try {
      const publicUrl = await uploadContentImage({
        file,
        requestUpload: (selectedFile) => requestContentImageUpload(selectedFile),
        uploadToSignedUrl: uploadFileToSignedUrl,
      });

      onUploaded(createImageMarkdown(alt, publicUrl));
      setFile(null);
      setAlt("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage({ kind: "success", text: "已上傳，圖片語法已插入內容欄位。" });
    } catch (uploadError) {
      // 失敗時只顯示原因，內容欄位不受影響。
      setMessage({ kind: "error", text: uploadError instanceof Error ? uploadError.message : "圖片上傳失敗，請稍後再試。" });
    } finally {
      setPending(false);
    }
  }

  function handleAltKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 在替代文字欄按 Enter：改成上傳，不要送出整份文章表單。
    if (event.key === "Enter") {
      event.preventDefault();
      void handleUpload();
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-black">上傳圖片</p>
        <p className="text-xs leading-5 text-black/55">
          PNG、JPG、WebP 或 GIF，單檔不超過 5MB。上傳後會把圖片語法插入內容欄位的游標位置；還沒點過內容欄位時加在最後。
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-black" htmlFor={fileInputId}>
          圖片檔案
        </label>
        <input
          accept={CONTENT_IMAGE_TYPES.join(",")}
          className="block w-full text-sm text-black/70 file:mr-3 file:rounded-full file:border file:border-black/10 file:bg-white file:px-4 file:py-2 file:text-sm file:text-black"
          disabled={disabled || pending}
          id={fileInputId}
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-black" htmlFor={`${id}-alt`}>
          替代文字
        </label>
        <p className="text-xs leading-5 text-black/55">必填。用一句話描述圖片內容，給看不到圖片的讀者（例如使用螢幕閱讀器的人）。</p>
        <input
          className="w-full rounded-2xl border border-black/10 px-4 py-2 text-sm outline-none transition focus:border-black/30"
          disabled={disabled || pending}
          id={`${id}-alt`}
          onChange={(event) => setAlt(event.target.value)}
          onKeyDown={handleAltKeyDown}
          type="text"
          value={alt}
        />
      </div>

      <button
        className="inline-flex w-fit rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || pending}
        onClick={() => void handleUpload()}
        type="button"
      >
        {pending ? "上傳中..." : "上傳圖片"}
      </button>

      {message?.kind === "error" ? (
        <p className="text-sm text-red-600" role="alert">
          {message.text}
        </p>
      ) : null}
      {message?.kind === "success" ? (
        <p aria-live="polite" className="text-sm text-black/55">
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
