// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站導覽列，提供首頁、文章與關於我入口。

import { cookies } from "next/headers";
import Image from "next/image";
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
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/78 backdrop-blur-md">
      <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-5">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground/92"
          >
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-transparent">
              <Image
                src="/amber-avatar.png"
                alt="Amber Chang avatar"
                width={36}
                height={36}
                className="size-9"
                priority
              />
            </span>
            <span>Amber Chang</span>
          </Link>

          <details className="group lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-border/80 px-4 text-sm text-foreground/82 transition-colors hover:border-foreground/30">
              Menu
            </summary>
            <nav className="absolute inset-x-4 top-full mt-3 rounded-[1.5rem] border border-border/80 bg-background/96 p-4 shadow-sm backdrop-blur md:inset-x-6">
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <Link href="/projects" className="rounded-full px-2 py-1 hover:text-foreground">
                  專案
                </Link>
                <Link href="/blog" className="rounded-full px-2 py-1 hover:text-foreground">
                  文章
                </Link>
                <Link href="/about" className="rounded-full px-2 py-1 hover:text-foreground">
                  關於我
                </Link>
                {hasAdminSession ? (
                  <>
                    <Link href="/admin/posts" className="rounded-full px-2 py-1 font-medium text-foreground hover:text-foreground/80">
                      後台
                    </Link>
                    <form action={requestAdminLogout}>
                      <Button className="h-auto w-full rounded-full border-border/80 px-3 py-2" size="sm" type="submit" variant="outline">
                        登出
                      </Button>
                    </form>
                  </>
                ) : null}
              </div>
            </nav>
          </details>
        </div>

        <nav className="hidden items-center justify-end gap-5 text-sm text-muted-foreground lg:flex">
          <Link href="/projects" className="hover:text-foreground">
            專案
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            文章
          </Link>
          <Link href="/about" className="hover:text-foreground">
            關於我
          </Link>
          {hasAdminSession ? (
            <>
              <Link href="/admin/posts" className="font-medium text-foreground hover:text-foreground/80">
                後台
              </Link>
              <form action={requestAdminLogout}>
                <Button className="h-auto rounded-full border-border/80 px-3 py-1.5" size="sm" type="submit" variant="outline">
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
