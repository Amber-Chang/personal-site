"use client";

// 功能：頁首的「後台」與「登出」（SPEC-005）。頁面本身是預先產生的，不知道誰在看；
// 載入後才在瀏覽器判斷：沒有 Supabase 登入 cookie 就不顯示、也不送請求；有 cookie 才問伺服器是不是管理員。
// 換頁時重新判斷，登出後 cookie 被清掉，入口跟著消失。頁首高度固定（h-15），入口出現前後高度不變。

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { requestAdminLogout } from "@/app/admin/logout/actions";
import { readIsAdminFromBrowser } from "@/lib/auth/admin-session-client";

import { adminLinkClassName, navLinkClassName } from "./header-nav-styles";

export function HeaderAdminLinks() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void readIsAdminFromBrowser({
      cookie: document.cookie,
      fetch: window.fetch.bind(window),
      signal: controller.signal,
    }).then((result) => {
      if (!controller.signal.aborted) {
        setIsAdmin(result);
      }
    });

    return () => controller.abort();
  }, [pathname]);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Link className={adminLinkClassName} href="/admin/posts">
        後台
      </Link>
      <form action={requestAdminLogout}>
        <button className={navLinkClassName} type="submit">
          登出
        </button>
      </form>
    </>
  );
}
