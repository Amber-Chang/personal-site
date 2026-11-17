// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站頁首（SPEC-004）。左上角站名連回首頁，右邊只有 About；登入的管理員另外看到「後台」與「登出」。
// 項目少，手機上也直接排開，不需要收合選單。
// SPEC-005：頁首在伺服器渲染時不讀 cookie 或登入狀態，公開頁才能預先產生；管理員入口交給瀏覽器端的 HeaderAdminLinks。

import Link from "next/link";

import { HeaderAdminLinks } from "./HeaderAdminLinks";
import { navLinkClassName } from "./header-nav-styles";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-15 w-full max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
        <Link className="focus-ring inline-flex min-h-11 items-center font-semibold" href="/">
          Amber Chang
        </Link>

        <nav aria-label="主要導覽" className="flex items-center gap-5">
          <Link className={navLinkClassName} href="/about">
            About
          </Link>
          <HeaderAdminLinks />
        </nav>
      </div>
    </header>
  );
}
