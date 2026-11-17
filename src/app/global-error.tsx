"use client";

// 功能：最後防線錯誤頁（SPEC-005）。根版面本身出錯時，Next.js 用這一頁取代整個網站版面，
// 所以自己帶 <html>、<body> 與樣式（globals.css），不依賴根版面，也不放頁首與頁尾。
// 文案與按鈕和一般錯誤頁相同（ErrorPageContent）；不顯示錯誤內容。

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { ErrorPageContent } from "@/components/ErrorPageContent";

import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <html lang="zh-Hant">
      <head>
        <title>這個頁面暫時無法顯示 — Amber Chang</title>
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6 md:py-14">
          <ErrorPageContent onRetry={retry} />
        </main>
      </body>
    </html>
  );
}
