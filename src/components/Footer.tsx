// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站頁尾，提供簡潔導覽與聯絡方式。

import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/70">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-3 px-4 py-6 text-center text-sm text-muted-foreground md:py-7">
        <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground/85">
          <Link href="/projects" className="hover:text-foreground">
            Projects
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/blog" className="hover:text-foreground">
            Writing &amp; Notes
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>

        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-sm font-medium text-foreground">Amber Chang</p>
          <span className="hidden text-muted-foreground/50 sm:inline">/</span>
          <a
            href="mailto:taco5239@gmail.com"
            className="w-fit underline decoration-muted-foreground/60 underline-offset-4 hover:text-foreground"
          >
            taco5239@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
