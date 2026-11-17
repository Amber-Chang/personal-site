// 頁首導覽的連結樣式。Header（伺服器端）與 HeaderAdminLinks（瀏覽器端）共用，
// 放在一般模組裡：從 "use client" 檔案匯入的字串常數，在伺服器元件裡拿不到原本的值。

const navItemClassName =
  "focus-ring inline-flex min-h-11 items-center text-sm underline-offset-4 transition-colors hover:text-foreground hover:underline";

export const navLinkClassName = `${navItemClassName} text-muted-foreground`;
// 「後台」是管理員的主要入口，字色較深。
export const adminLinkClassName = `${navItemClassName} font-medium text-foreground`;
