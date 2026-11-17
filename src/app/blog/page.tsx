// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：文章列表＝文章分頁（SPEC-004）。寬螢幕兩欄：左欄身分區，右欄是分頁與全部已上架文章。
// 這頁的 H1 只給螢幕閱讀器；身分區的定位句在這頁不是 H1。資料與數量在 data.ts。

import Link from "next/link";
import type { Metadata } from "next";
import { ContentTabs } from "@/components/ContentTabs";
import { IdentityColumn } from "@/components/IdentityColumn";
import { PostHogPageView } from "@/components/PostHogPageView";
import { PostRow } from "@/components/PostRow";
import { createPageViewProperties } from "@/lib/analytics/pageview";
import { sharedOpenGraph } from "../shared-metadata";
import { getPublicBlogContentService } from "./blog-context";
import { loadBlogIndexPageData } from "./data";

export const metadata: Metadata = {
  title: "Writing & Notes — Amber Chang",
  description: "Amber 的文章列表：AI 協作、產品管理、學習紀錄。",
  openGraph: {
    ...sharedOpenGraph,
    title: "Writing & Notes — Amber Chang",
    description: "Amber 的文章列表：AI 協作、產品管理、學習紀錄。",
  },
};

// 預先產生的頁面（SPEC-005）：後台每次變更內容都會立即標記需要更新；另外每小時自動更新一次，
// 處理不經過後台的資料變更。更新時 Supabase 連不上，繼續提供上一版。
export const revalidate = 3600;

export default async function BlogPage() {
  const { counts, posts } = await loadBlogIndexPageData({
    service: getPublicBlogContentService(),
  });

  return (
    <div className="grid gap-9 lg:grid-cols-[18.75rem_minmax(0,1fr)] lg:gap-18">
      <PostHogPageView
        properties={createPageViewProperties({
          contentType: "blog_index",
          sourceTemplate: "blog_index",
        })}
      />
      <h1 className="sr-only">文章</h1>
      <IdentityColumn ledeAs="p" />
      <div>
        <ContentTabs active="posts" counts={counts} />
        {posts.length > 0 ? (
          <div>
            {posts.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">目前還沒有公開的文章。</p>
        )}
        <Link
          className="focus-ring mt-6 inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          href="/"
        >
          ← 回到案例
        </Link>
      </div>
    </div>
  );
}
