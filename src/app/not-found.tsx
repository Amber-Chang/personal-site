// 功能：全站 404 頁。取代 Next.js 預設英文頁（預設頁會插入 body 白底樣式，蓋掉站內米白背景），
// 並提供回站內的入口。不存在的文章、作品網址呼叫 notFound() 時也會顯示這一頁。單欄（SPEC-004）。

import Link from "next/link";
import type { Metadata } from "next";
import { primaryButtonClassName, secondaryButtonClassName } from "@/components/button-styles";

export const metadata: Metadata = {
  title: "找不到這個頁面 — Amber Chang",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-180">
      <p className="text-label tracking-label text-muted-foreground">404</p>
      <h1 className="mt-2 text-article-title font-semibold tracking-heading">找不到這個頁面</h1>
      <p className="mt-4 text-base leading-8 text-muted-foreground">
        網址可能打錯了，或這個頁面已經不存在。可以從下面的入口繼續看看。
      </p>

      <nav aria-label="站內入口" className="mt-8 flex flex-wrap gap-2.5">
        <Link className={primaryButtonClassName} href="/">
          案例
        </Link>
        <Link className={secondaryButtonClassName} href="/blog">
          文章
        </Link>
      </nav>
    </div>
  );
}
