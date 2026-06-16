"use client";

import { useActionState } from "react";

import { requestAdminLogin } from "./actions";
import { initialAdminLoginFormState } from "./action-state";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(requestAdminLogin, initialAdminLoginFormState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm leading-6 text-black/65">
        只接受 allowlisted 的 Google 帳號登入。完成授權後，系統會自動帶你回到後台。
      </p>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        className="inline-flex rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/30"
        disabled={pending}
        type="submit"
      >
        {pending ? "前往 Google 中..." : "使用 Google 登入"}
      </button>
    </form>
  );
}
