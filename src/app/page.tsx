// [AI-ASSISTED] Updated with Codex, 2026-05-18
// 功能：首頁，採編輯式敘事呈現定位、成果、代表案例與精選文章。

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
  description: "用產品思維、系統理解與寫作，整理工作現場與生活裡那些還說不清楚的問題。",
  openGraph: {
    title: "Amber Chang — AI-native Product Builder",
    description: "用產品思維、系統理解與寫作，整理工作現場與生活裡那些還說不清楚的問題。",
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
            <p className="text-tagline tracking-label text-muted-foreground">
              AI-native product portfolio
            </p>
          </div>
          {/* 最大寬度用 em：15em 約等於 15 個中文字（含 -0.03em 字距），不論字級多大，第一句剛好一行，第二句斷成 15 + 7 字，不會只剩「楚的問題。」 */}
          <h1 className="max-w-[15em] text-balance font-display text-display font-semibold tracking-heading">
            我用產品思維、系統理解與寫作，
            <br />
            整理那些在工作現場與生活裡還說不清楚的問題。
          </h1>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.5fr_0.7fr] md:items-end md:gap-12">
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

          <div className="space-y-4 border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <p className="text-label tracking-label text-muted-foreground">Focus</p>
            <ul className="space-y-2.5 text-sm leading-6 text-foreground-soft">
              <li>AI-native workflow</li>
              <li>Product &amp; systems thinking</li>
              <li>Notes from work and life</li>
            </ul>
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
