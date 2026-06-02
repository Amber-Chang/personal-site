"use client";

import { useActionState } from "react";

import { requestAdminLogin } from "./actions";
import { initialAdminLoginFormState } from "./action-state";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(requestAdminLogin, initialAdminLoginFormState);

  return (
    <form action={formAction} className="space-y-4">
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

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-700">已寄出 magic link，請到信箱完成登入。</p> : null}

      <button
        className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/30"
        disabled={pending}
        type="submit"
      >
        {pending ? "寄送中..." : "寄送 magic link"}
      </button>
    </form>
  );
}
