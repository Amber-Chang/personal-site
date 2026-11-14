// [AI-ASSISTED] Updated with Codex, 2026-05-18
// 功能：首頁，固定五段：身分 → 代表案例 → 精選文章 → 關於我（短版）→ 聯絡（SPEC-002）。

import Link from "next/link";
import type { Metadata } from "next";
import { PostHogPageView } from "@/components/PostHogPageView";
import { PostCard } from "@/components/PostCard";
import { ProjectCard } from "@/components/ProjectCard";
import { SectionHeading } from "@/components/SectionHeading";
import { createPageViewProperties } from "@/lib/analytics/pageview";
import { getPublicBlogContentService } from "./blog/blog-context";
import { loadHomeFeaturedProjectsData, loadHomeWritingData } from "./home-data";

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
  const service = getPublicBlogContentService();
  const [{ posts: latestPosts }, { projects: featuredProjects }] = await Promise.all([
    loadHomeWritingData({
      service,
    }),
    loadHomeFeaturedProjectsData({
      service,
    }),
  ]);
  return (
    <div className="space-y-20 pb-6 md:space-y-32 md:pb-10">
      <PostHogPageView
        properties={createPageViewProperties({
          contentType: "home",
          sourceTemplate: "home",
        })}
      />
      <section className="space-y-10 border-b border-border pb-14 pt-6 md:space-y-14 md:pb-20 md:pt-10">
        <div className="space-y-5 md:space-y-6">
          <div className="space-y-1.5">
            <p className="text-lg font-medium tracking-heading text-foreground-soft md:text-xl">Amber Chang</p>
            <p className="text-tagline tracking-label text-muted-foreground">Product Manager / Product Builder</p>
          </div>
          {/* break-keep 讓中文只在 <wbr /> 與空白處換行，不把「產品」「可以」這類詞拆成兩行；text-balance 再把各行長度拉平，最後一行不會只剩幾個字。 */}
          <h1 className="text-balance break-keep font-display text-display font-semibold tracking-heading">
            我把模糊的需求<wbr />整理成<wbr />可以上線的產品，<wbr />並用 AI <wbr />把想法<wbr />更快做成成果。
          </h1>
        </div>

        <div className="space-y-8">
          <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            這裡放我做過的專案，也放我持續在想的事。
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/projects"
              className="inline-flex min-h-12 items-center rounded-full bg-foreground px-6 py-3 text-base font-medium text-background transition-colors hover:bg-foreground-soft"
            >
              Projects
            </Link>
            <Link
              href="/blog"
              className="inline-flex min-h-12 items-center rounded-full border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:border-strong"
            >
              Writing &amp; Notes
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-7 md:space-y-9">
        <SectionHeading
          title="Projects"
          description="這些是我怎麼理解問題、整理脈絡，並把它們慢慢推進成成果的紀錄。"
          link={{ href: "/projects", label: "All projects" }}
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((project) => <ProjectCard key={project.slug} project={project} />)
          ) : (
            <p className="text-sm text-muted-foreground">目前還沒有公開案例。</p>
          )}
        </div>
      </section>

      <section className="space-y-7 md:space-y-9">
        <SectionHeading
          title="Writing & Notes"
          description="我記工作裡的判斷，也記生活裡那些還值得想一下的事。"
          link={{ href: "/blog", label: "All posts" }}
        />

        <div className="space-y-4 md:space-y-5">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => <PostCard key={post.slug} post={post} />)
          ) : (
            <p className="text-sm text-muted-foreground">目前還沒有精選文章，敬請期待。</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading title="About" />
        <p className="max-w-2xl text-pretty text-base leading-8 text-foreground-soft">我從教育現場、BD 與產品規劃，一路走到產品經理。現在是 AI 產品經理，協助公司進行組織 AI 化。</p>
        <Link
          href="/about"
          className="inline-block text-base text-muted-foreground underline decoration-muted-foreground/60 underline-offset-4 hover:text-foreground"
        >
          更多關於我
        </Link>
      </section>

      <section className="space-y-4 pt-2 md:pt-4">
        <SectionHeading title="Contact" />
        <a
          href="mailto:taco5239@gmail.com"
          className="inline-block text-base text-muted-foreground underline decoration-muted-foreground/60 underline-offset-4 hover:text-foreground"
        >
          如果你想聊聊，歡迎來信。
        </a>
      </section>
    </div>
  );
}
