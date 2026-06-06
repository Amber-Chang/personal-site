"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { clearActiveAdminSession } from "@/lib/auth/session-server.ts";
import { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_OPTIONS } from "@/lib/auth/session.ts";

export async function requestAdminLogout() {
  const cookieStore = await cookies();

  await clearActiveAdminSession({
    cookieStore,
  });

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, "", {
    ...ADMIN_SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });

  redirect("/admin/login");
}
