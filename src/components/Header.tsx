// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站導覽列，提供首頁、文章與關於我入口。

import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Amber Chang
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/projects" className="transition-colors hover:text-foreground">
            專案
          </Link>
          <Link href="/blog" className="transition-colors hover:text-foreground">
            文章
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground">
            關於我
          </Link>
        </nav>
      </div>
    </header>
  );
}
