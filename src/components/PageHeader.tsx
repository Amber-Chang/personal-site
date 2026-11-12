// 功能：列表頁與 About 的頁首（返回連結＋頁面大標＋副標），以及內頁共用的返回連結。只負責樣式與結構，不讀資料。

import Link from "next/link";

// 「← 返回…」連結。-mt-3 搭配 min-h-8 讓可點高度 ≥ 24px，同時維持原本的視覺位置。
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="-mt-3 inline-flex min-h-8 items-end text-sm text-muted-foreground hover:underline">
      {`← ${label}`}
    </Link>
  );
}

type PageHeaderProps = {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
};

export function PageHeader({ backHref, backLabel, title, description }: PageHeaderProps) {
  return (
    <header className="space-y-2">
      <BackLink href={backHref} label={backLabel} />
      <h1 className="font-display text-title font-semibold tracking-heading">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </header>
  );
}
