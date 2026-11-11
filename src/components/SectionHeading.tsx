// 功能：首頁區塊標題（h2＋說明＋右側「All …」連結）。只負責樣式與結構，不讀資料。

import Link from "next/link";

type SectionHeadingProps = {
  title: string;
  description?: string;
  link?: { href: string; label: string };
};

export function SectionHeading({ title, description, link }: SectionHeadingProps) {
  const heading = <h2 className="font-display text-heading font-semibold tracking-heading">{title}</h2>;

  // 只有標題時直接輸出 h2，不多包一層。
  if (!description && !link) {
    return heading;
  }

  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-2">
        {heading}
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {link ? (
        <Link
          href={link.href}
          className="-mt-3 inline-flex min-h-8 shrink-0 items-end text-sm underline underline-offset-4 hover:text-foreground"
        >
          {link.label}
        </Link>
      ) : null}
    </div>
  );
}
