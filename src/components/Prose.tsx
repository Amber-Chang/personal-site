// 功能：長文排版容器。文章、案例內頁與 About 共用同一組 prose 樣式；只負責樣式與結構，不讀資料。

import type { ReactNode } from "react";

// 所有長文共用：字級、標題字體、段落深淺，以及引言、連結、程式碼、圖片的樣式。
const baseClassName = [
  "prose prose-neutral max-w-none text-body leading-8",
  "prose-headings:font-display prose-headings:tracking-heading",
  "prose-h2:mt-12 prose-h2:text-prose-h2 prose-h2:font-semibold",
  "prose-h3:mt-8 prose-h3:text-prose-h3 prose-h3:leading-snug prose-h3:font-semibold",
  "prose-p:text-foreground-soft prose-p:leading-8 prose-li:leading-8",
  "prose-blockquote:border-l-border prose-blockquote:text-foreground-soft",
  "prose-strong:text-foreground prose-a:text-foreground prose-a:decoration-muted-foreground/60 prose-a:underline-offset-4 hover:prose-a:text-primary",
  "prose-code:rounded prose-code:bg-muted/65 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.92em]",
  "prose-pre:rounded-panel prose-pre:border prose-pre:border-border prose-pre:bg-card/80",
  "prose-img:rounded-panel prose-img:border prose-img:border-border",
].join(" ");

// 只有 Markdown 長文才加：大標行高較緊、桌機內文行高 2.25rem。
const articleClassName = "prose-h2:leading-tight md:leading-9";

type ProseProps = {
  children: ReactNode;
  // article：文章、案例內頁的 Markdown 內容。page：手寫的頁面文案（About），保留原本較鬆的大標行高。
  variant?: "article" | "page";
  // 外層標籤。About 的整段文案本身就是一篇 article。
  as?: "div" | "article";
};

export function Prose({ children, variant = "article", as: Tag = "div" }: ProseProps) {
  const className = variant === "article" ? `${baseClassName} ${articleClassName}` : baseClassName;

  return <Tag className={className}>{children}</Tag>;
}
