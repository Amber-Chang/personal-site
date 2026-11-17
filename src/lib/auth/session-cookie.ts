// 功能：辨認 Supabase 的登入 session cookie。伺服器端的 proxy（session-refresh.ts）與瀏覽器端的頁首入口
// （admin-session-client.ts）共用，只看名稱、不讀內容，也不代表已通過管理員檢查。

// sb-<專案代號>-auth-token，太長時分成 .0、.1… 多個。不含 PKCE 登入流程中途的 code-verifier。
const SESSION_COOKIE_PATTERN = /^sb-.+-auth-token(?:\.\d+)?$/;

export function isSupabaseSessionCookieName(name: string): boolean {
  return SESSION_COOKIE_PATTERN.test(name);
}

// 讀 document.cookie 格式的字串（name=value; name=value），只要有一個 session cookie 就算有。
export function hasSupabaseSessionCookie(cookieString: string): boolean {
  return cookieString.split(";").some((pair) => {
    const separatorIndex = pair.indexOf("=");
    const name = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);

    return isSupabaseSessionCookieName(name.trim());
  });
}
