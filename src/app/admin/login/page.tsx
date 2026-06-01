import { requestAdminLogin } from "./actions";

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

        <form action={requestAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-black" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <button
            className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85"
            type="submit"
          >
            寄送 magic link
          </button>
        </form>
      </div>
    </main>
  );
}
