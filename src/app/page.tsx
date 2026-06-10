// [AI-ASSISTED] Updated with Codex, 2026-05-18
// 功能：首頁，採編輯式敘事呈現定位、成果、代表案例與精選文章。

import Link from "next/link";
import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { ProjectCard } from "@/components/ProjectCard";
import { getPublicBlogContentService } from "./blog/blog-context";
import { loadHomeFeaturedProjectsData, loadHomeWritingData } from "./home-data";

export const metadata: Metadata = {
  title: "Amber Chang — AI-native Product Builder",
  description: "用 AI-native workflow 把模糊需求轉成可落地產品、流程與案例的產品工作者。",
  openGraph: {
    title: "Amber Chang — AI-native Product Builder",
    description: "用 AI-native workflow 把模糊需求轉成可落地產品、流程與案例的產品工作者。",
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
  const method = [
    "定義問題",
    "整理脈絡",
    "推進落地",
    "持續修正",
  ];

  return (
    <div className="space-y-20 pb-6 md:space-y-32 md:pb-10">
      <section className="space-y-10 border-b border-border/70 pb-14 pt-6 md:space-y-14 md:pb-20 md:pt-10">
        <div className="space-y-5 md:space-y-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Amber Chang / AI-native product portfolio</p>
          <h1 className="max-w-[13ch] font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-7xl">
            我把模糊的需求、想法與觀察，
            <br />
            整理成可以被推進的產品、內容與工作方式。
          </h1>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.5fr_0.7fr] md:items-end md:gap-12">
          <div className="space-y-8">
            <p className="max-w-xl text-lg leading-relaxed text-foreground/84 md:text-xl">
              這裡放我做過的專案，也放我持續在想的事。
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/projects"
                className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 py-2.5 text-background transition-colors hover:bg-foreground/90"
              >
                Projects
              </Link>
              <Link
                href="/blog"
                className="inline-flex min-h-11 items-center rounded-full border border-border px-5 py-2.5 text-foreground transition-colors hover:border-foreground/35"
              >
                文章與筆記
              </Link>
            </div>
          </div>

          <div className="space-y-4 border-t border-border/70 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Focus</p>
            <ul className="space-y-2.5 text-sm leading-6 text-foreground/78">
              <li>AI-native workflow</li>
              <li>Product thinking</li>
              <li>Writing and observation</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-7 md:space-y-9">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">Projects</h2>
          <Link href="/projects" className="shrink-0 text-sm underline underline-offset-4 hover:text-foreground">
            All projects
          </Link>
        </div>

        <div className="space-y-5 md:space-y-6">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((project) => <ProjectCard key={project.slug} project={project} />)
          ) : (
            <p className="text-sm text-muted-foreground">目前還沒有公開案例。</p>
          )}
        </div>
      </section>

      <section className="grid gap-10 border-y border-border/70 py-12 md:grid-cols-[0.7fr_1.3fr] md:gap-12 md:py-16">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">How I Work</h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {method.map((step, index) => (
            <li key={step} className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-5 md:px-6 md:py-6">
              <span className="block text-xs tracking-[0.22em] text-foreground/45">{String(index + 1).padStart(2, "0")}</span>
              <span className="mt-4 block text-lg text-foreground/82">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-7 md:space-y-9">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">Writing & Notes</h2>
            <p className="text-sm text-muted-foreground">一些工作中的思考，也一些生活裡的觀察。</p>
          </div>
          <Link href="/blog" className="shrink-0 text-sm underline underline-offset-4 hover:text-foreground">
            All posts
          </Link>
        </div>

        <div className="space-y-4 md:space-y-5">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => <PostCard key={post.slug} post={post} />)
          ) : (
            <p className="text-sm text-muted-foreground">目前還沒有精選文章，敬請期待。</p>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-2 md:pt-4">
        <p className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">Contact</p>
        <a
          href="mailto:taco5239@gmail.com"
          className="inline-block text-base text-muted-foreground underline decoration-muted-foreground/70 underline-offset-4 hover:text-foreground"
        >
          如果你想聊聊，歡迎來信。
        </a>
      </section>
    </div>
  );
}
