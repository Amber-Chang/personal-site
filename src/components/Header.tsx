// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站頁首（SPEC-004）。左上角站名連回首頁，右邊只有 About；登入的管理員另外看到「後台」與「登出」。
// 項目少，手機上也直接排開，不需要收合選單。

import { cookies } from "next/headers";
import Link from "next/link";

import { requestAdminLogout } from "@/app/admin/logout/actions";
import { readServerAdminAuthState } from "@/lib/auth/server-admin-auth";

const navItemClassName =
  "focus-ring inline-flex min-h-11 items-center text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline";
const navLinkClassName = `${navItemClassName} text-muted-foreground`;
// 「後台」是管理員的主要入口，字色較深。
const adminLinkClassName = `${navItemClassName} font-medium text-foreground`;

export async function Header() {
  await cookies();
  const adminAuthState = await readServerAdminAuthState();
  const showAdminAffordance = adminAuthState.isAdmin;

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
          {showAdminAffordance ? (
            <>
              <Link className={adminLinkClassName} href="/admin/posts">
                後台
              </Link>
              <form action={requestAdminLogout}>
                <button className={navLinkClassName} type="submit">
                  登出
                </button>
              </form>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
