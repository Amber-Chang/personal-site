// [AI-ASSISTED] Updated with Codex, 2026-05-18
// 功能：首頁＝案例分頁（SPEC-004）。寬螢幕兩欄：左欄身分區（定位句是這頁的 H1），右欄是分頁與全部已上架案例。
// 排序與數量在 home-data.ts，頁面只負責組裝。

import Link from "next/link";
import type { Metadata } from "next";
import { CaseBlock } from "@/components/CaseBlock";
import { ContentTabs } from "@/components/ContentTabs";
import { IdentityColumn } from "@/components/IdentityColumn";
import { PostHogPageView } from "@/components/PostHogPageView";
import { createPageViewProperties } from "@/lib/analytics/pageview";
import { getPublicBlogContentService } from "./blog/blog-context";
import { loadHomePageData } from "./home-data";

export const metadata: Metadata = {
  title: "Amber Chang — AI-native Product Builder",
  description: "我把模糊的需求整理成可以上線的產品，並用 AI 把想法更快做成成果。",
  openGraph: {
    title: "Amber Chang — AI-native Product Builder",
    description: "我把模糊的需求整理成可以上線的產品，並用 AI 把想法更快做成成果。",
  },
};

export const revalidate = 0;

export default async function HomePage() {
  const { counts, projects } = await loadHomePageData({
    service: getPublicBlogContentService(),
  });

  return (
    <div className="grid gap-9 lg:grid-cols-[18.75rem_minmax(0,1fr)] lg:gap-18">
      <PostHogPageView
        properties={createPageViewProperties({
          contentType: "home",
          sourceTemplate: "home",
        })}
      />
      <IdentityColumn ledeAs="h1" />
      <div>
        <ContentTabs active="cases" counts={counts} />
        {projects.length > 0 ? (
          <div className="mt-4 space-y-4">
            {projects.map((project) => (
              <CaseBlock key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">目前還沒有公開的案例。</p>
        )}
        <Link
          className="focus-ring mt-6 inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          href="/blog"
        >
          也看看我寫的文章 →
        </Link>
      </div>
    </div>
  );
}
