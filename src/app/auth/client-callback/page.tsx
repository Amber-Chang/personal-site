"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "../../../lib/infra/supabase/client.ts";

type BrowserSupabaseClient = {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
    setSession: (session: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ error: Error | null }>;
  };
};

export default function AuthClientCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("正在完成登入...");

  useEffect(() => {
    async function completeLogin() {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");

      if (code) {
        window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
        return;
      }

      const supabase = createBrowserSupabaseClient() as BrowserSupabaseClient;
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setMessage("登入連結無效，請重新寄送 magic link。");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setMessage("登入失敗，請重新寄送 magic link。");
        return;
      }

      router.replace("/admin/posts");
    }

    void completeLogin();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <div className="space-y-3 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.24em] text-black/50">Blog Admin</p>
        <h1 className="text-3xl font-semibold text-black">完成登入</h1>
        <p className="text-sm leading-6 text-black/65">{message}</p>
      </div>
    </main>
  );
}
