// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站導覽列，提供首頁、文章與關於我入口。

import { cookies } from "next/headers";
import Link from "next/link";

import { requestAdminLogout } from "@/app/admin/logout/actions";
import { hasActiveAdminSession } from "@/lib/auth/session-server";
import { Button } from "@/components/ui/button";

export async function Header() {
  const cookieStore = await cookies();
  const hasAdminSession = await hasActiveAdminSession({
    cookieStore,
  });

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
          {hasAdminSession ? (
            <>
              <Link href="/admin/posts" className="font-medium text-foreground transition-colors hover:text-foreground/80">
                後台
              </Link>
              <form action={requestAdminLogout}>
                <Button className="h-auto rounded-full px-3 py-1.5" size="sm" type="submit" variant="outline">
                  登出
                </Button>
              </form>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
