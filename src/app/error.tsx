"use client";

// 功能：一般錯誤頁（SPEC-005）。頁面在讀取或顯示時出錯（例如 Supabase 暫停、從沒產生過的頁面讀不到資料）時，
// 在原本的頁首與頁尾之間顯示這一頁，取代 Next.js 的英文錯誤訊息。不顯示錯誤內容。
// 「重新整理」：先向伺服器重新要這一頁的資料，再讓錯誤邊界重新顯示內容（只呼叫 reset 會沿用出錯的那份資料）。

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { ErrorPageContent } from "@/components/ErrorPageContent";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return <ErrorPageContent onRetry={retry} />;
}
