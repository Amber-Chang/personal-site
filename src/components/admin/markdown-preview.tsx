// 功能：後台預覽。用和前台文章、案例內頁相同的 Prose 與 MarkdownContent 輸出目前內容欄位的文字
// （含尚未儲存的修改），所以表格、程式碼上色、Mermaid 與圖片都和前台一致。只讀內容，不儲存、不發佈。
// 由 MarkdownContentField 在第一次打開預覽時才載入，平常編輯不需要下載 Markdown 與上色程式。

import { MarkdownContent } from "../MarkdownContent.tsx";
import { Prose } from "../Prose.tsx";

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-sm text-black/55">目前沒有內容可以預覽。</p>;
  }

  return (
    <Prose>
      <MarkdownContent content={content} />
    </Prose>
  );
}
