// 功能：全站 404 頁。取代 Next.js 預設英文頁（預設頁會插入 body 白底樣式，蓋掉站內米白背景），
// 並提供回站內的入口。不存在的文章、作品網址呼叫 notFound() 時也會顯示這一頁。

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "找不到這個頁面 — Amber Chang",
};

export default function NotFound() {
  return (
    <div className="space-y-10 pt-4 md:space-y-12 md:pt-8">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.08em] text-muted-foreground">404</p>
        <h1 className="font-[family-name:var(--font-display)] text-[2.25rem] font-semibold tracking-[-0.03em] md:text-[2.6rem]">
          找不到這個頁面
        </h1>
        <p className="max-w-xl text-base leading-8 text-muted-foreground">
          網址可能打錯了，或這個頁面已經不存在。可以從下面的入口繼續看看。
        </p>
      </header>

      <nav aria-label="站內入口" className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full bg-foreground px-6 py-3 text-base font-medium text-background transition-colors hover:bg-foreground/90"
        >
          回首頁
        </Link>
        <Link
          href="/projects"
          className="inline-flex min-h-12 items-center rounded-full border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:border-foreground/35"
        >
          Projects
        </Link>
        <Link
          href="/blog"
          className="inline-flex min-h-12 items-center rounded-full border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:border-foreground/35"
        >
          Writing &amp; Notes
        </Link>
      </nav>
    </div>
  );
}
