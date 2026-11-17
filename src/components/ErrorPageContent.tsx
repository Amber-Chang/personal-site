"use client";

// 功能：錯誤頁的內容（SPEC-005，文案經 PM 確認）。一般錯誤頁（app/error.tsx）與最後防線錯誤頁（app/global-error.tsx）共用。
// 不顯示錯誤訊息或技術細節。版面比照 404：單欄、一個 H1、主要按鈕「重新整理」、次要按鈕「回首頁」。
// 「回首頁」換到別的網址時，Next.js 的錯誤邊界會自動清掉錯誤狀態。

import Link from "next/link";

import { primaryButtonClassName, secondaryButtonClassName } from "./button-styles";

const CONTACT_EMAIL = "taco5239@gmail.com";

// 句子裡的 email：點一下就選取整個地址（方便沒有設定郵件程式的人複製），同時是 mailto 連結。
// 可點高度 44px；上下的負邊距抵銷多出來的高度，不撐開行距。
const emailLinkClassName =
  "focus-ring -my-1.5 inline-flex min-h-11 select-all items-center text-foreground underline decoration-muted-foreground/60 underline-offset-4 transition-colors hover:decoration-foreground";

export function ErrorPageContent({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-180">
      <h1 className="text-article-title font-semibold tracking-heading">這個頁面暫時無法顯示</h1>
      <p className="mt-4 text-base leading-8 text-muted-foreground">
        可能是網站正在維護，請稍後再試。如果急著找我，可以直接寫信到{" "}
        <a className={emailLinkClassName} href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        。
      </p>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <button className={primaryButtonClassName} onClick={onRetry} type="button">
          重新整理
        </button>
        <Link className={secondaryButtonClassName} href="/">
          回首頁
        </Link>
      </div>
    </div>
  );
}
