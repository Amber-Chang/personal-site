// 功能：首頁與文章列表右欄最上方的分頁（SPEC-004）。分頁就是導覽：「案例」連到 /，「文章」連到 /blog，
// 都是一般連結，沒有 JavaScript 也能用。目前所在的分頁有 aria-current="page" 與赤陶底線。

import Link from "next/link";

export type ContentTabKey = "cases" | "posts";

export function ContentTabs({ active, counts }: { active: ContentTabKey; counts: Record<ContentTabKey, number> }) {
  const tabs = [
    { count: counts.cases, href: "/", key: "cases", label: "案例" },
    { count: counts.posts, href: "/blog", key: "posts", label: "文章" },
  ] as const;

  return (
    <nav aria-label="內容分類" className="flex gap-7 border-b border-border">
      {tabs.map((tab) => (
        <Link
          aria-current={tab.key === active ? "page" : undefined}
          className="focus-ring -mb-px inline-flex min-h-11 items-center border-b-2 border-transparent px-0.5 text-base font-semibold text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-terracotta aria-[current=page]:text-foreground"
          href={tab.href}
          key={tab.key}
        >
          {tab.label}
          <span className="ml-1.5 text-label font-normal">{tab.count}</span>
        </Link>
      ))}
    </nav>
  );
}
