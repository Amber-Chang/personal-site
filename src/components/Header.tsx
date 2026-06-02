// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站導覽列，提供首頁、文章與關於我入口。

import { cookies } from "next/headers";
import Link from "next/link";

import { ADMIN_SESSION_COOKIE_NAME, hasValidAdminSessionToken } from "@/lib/auth/session";
import { readSupabaseEnv } from "@/lib/infra/supabase/env";

export async function Header() {
  const env = readSupabaseEnv();
  const cookieStore = await cookies();
  const hasAdminSession = hasValidAdminSessionToken({
    adminPassword: env.adminPassword,
    sessionToken: cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value,
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
            <Link href="/admin/posts" className="font-medium text-foreground transition-colors hover:text-foreground/80">
              後台
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
