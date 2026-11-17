// 功能：回答「目前的瀏覽器是不是允許的管理員」（SPEC-005）。頁首的「後台」「登出」靠它決定要不要出現，
// 公開頁本身因此不必在伺服器端讀 cookie，可以預先產生。
// 只回 { isAdmin }：不回 email 或其他個資；允許清單仍只在伺服器端判斷。回應一律不快取。
// route.ts 接上真正的登入檢查；這裡的依賴可替換，方便測試每種情況。

export type AdminSessionStatusDependencies = {
  getAdminAuthState: () => Promise<{ isAdmin: boolean }>;
  logError?: (message: string, error?: unknown) => void;
};

function statusResponse(isAdmin: boolean, status: number) {
  return Response.json(
    { isAdmin },
    {
      headers: { "cache-control": "no-store" },
      status,
    },
  );
}

export function createAdminSessionStatusHandler(dependencies: AdminSessionStatusDependencies) {
  const logError = dependencies.logError ?? ((message: string, error?: unknown) => console.error(message, error));

  return async function handleAdminSessionStatus(): Promise<Response> {
    try {
      const authState = await dependencies.getAdminAuthState();

      return statusResponse(authState.isAdmin === true, 200);
    } catch (error) {
      // 檢查失敗（例如 Supabase 連不上）時當成不是管理員，頁首只顯示 About；錯誤細節只寫進伺服器紀錄。
      logError("admin session status check failed", error);

      return statusResponse(false, 500);
    }
  };
}
