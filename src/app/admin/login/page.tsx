import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-black/50">Blog Admin</p>
          <h1 className="text-3xl font-semibold text-black">使用 magic link 登入後台</h1>
          <p className="text-sm leading-6 text-black/65">
            第一版只開放 allowlist 內的 email。送出後請到信箱點擊登入連結。
          </p>
        </div>

        <AdminLoginForm />
      </div>
    </main>
  );
}
