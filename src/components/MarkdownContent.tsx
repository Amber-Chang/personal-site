// 功能：把 Markdown 內容輸出成 HTML 元素。文章內頁、案例內頁與後台預覽共用，確保三處輸出一致。
// 支援表格、刪除線、待辦清單、程式碼上色與圖片延後載入；Markdown 裡的原始 HTML 只會顯示成文字。
// 排版樣式由外層的 Prose 負責。這個元件不讀資料、不用瀏覽器 API，伺服器端與後台預覽都能使用。

import ReactMarkdown from "react-markdown";

import { createMarkdownComponents, rehypePlugins, remarkPlugins } from "../lib/markdown/markdown-options.ts";

const components = createMarkdownComponents();

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown components={components} rehypePlugins={rehypePlugins} remarkPlugins={remarkPlugins}>
      {content}
    </ReactMarkdown>
  );
}
