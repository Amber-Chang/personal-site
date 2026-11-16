// 功能：內頁上方的「← …」返回連結（SPEC-004）：文章內頁回「文章」、案例內頁回「案例」、About 回「首頁」。
// 可點高度 44px，鍵盤焦點用赤陶外框。只負責樣式與結構，不讀資料。

import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="focus-ring inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground" href={href}>
      {`← ${label}`}
    </Link>
  );
}
