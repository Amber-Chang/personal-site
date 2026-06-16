import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminLoginErrorMessage } from "@/lib/auth/login-error.ts";
import { readServerAdminAuthState } from "@/lib/auth/server-admin-auth.ts";
import { AdminLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  await cookies();
  const resolvedSearchParams = await searchParams;
  const errorParam = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams?.error;
  const errorMessage = getAdminLoginErrorMessage(errorParam ?? null);
  const adminAuthState = await readServerAdminAuthState();

  if (adminAuthState.isAdmin) {
    redirect("/admin/posts");
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-black/50">Blog Admin</p>
          <h1 className="text-3xl font-semibold text-black">使用 Google 登入後台</h1>
          <p className="text-sm leading-6 text-black/65">
            後台已改為 Google OAuth。請使用允許的 Google 帳號登入，系統會在完成授權後直接帶你進入後台。
          </p>
        </div>

        {errorMessage ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}

        <AdminLoginForm />
      </div>
    </main>
  );
}
