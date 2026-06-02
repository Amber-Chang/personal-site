import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE_NAME, hasValidAdminSessionToken } from "@/lib/auth/session.ts";
import { readSupabaseEnv } from "@/lib/infra/supabase/env.ts";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const env = readSupabaseEnv();
  const cookieStore = await cookies();

  if (
    hasValidAdminSessionToken({
      adminPassword: env.adminPassword,
      sessionToken: cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value,
    })
  ) {
    redirect("/admin/posts");
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-black/50">Blog Admin</p>
          <h1 className="text-3xl font-semibold text-black">使用密碼登入後台</h1>
          <p className="text-sm leading-6 text-black/65">
            第一版使用單一 admin 密碼登入，先把內容流程跑順，再視需要升級成完整 auth。
          </p>
        </div>

        <AdminLoginForm />
      </div>
    </main>
  );
}
