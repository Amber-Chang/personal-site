// [AI-ASSISTED] Updated with Codex, 2026-05-18
// 功能：首頁，採編輯式敘事呈現定位、成果、代表案例與精選文章。

import Link from "next/link";
import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { ProjectCard } from "@/components/ProjectCard";
import { getFeaturedProjects } from "@/lib/projects";
import { getPublicBlogContentService } from "./blog/blog-context";
import { loadHomeWritingData } from "./home-data";

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
  const { posts: latestPosts } = await loadHomeWritingData({
    service: getPublicBlogContentService(),
  });
  const featuredProjects = getFeaturedProjects();
  const outcomes = [
    "AI 寫作批改產品上線後月均使用量提升 2000%",
    "完成可實際運行的簡訊管理平台，作為自建 Delivery Core 第一階段",
    "持續把 PRD、SPEC、AI 協作與驗收流程串成可複用的建構方法",
  ];
  const capabilityStack = [
    {
      title: "AI-native Workflow",
      description: "把 AI 放進需求拆解、規格整理、驗收情境與迭代流程，而不是只拿來生成內容。",
    },
    {
      title: "Product Definition",
      description: "能把模糊需求收斂成 MVP 範圍、關鍵決策與可執行規格。",
    },
    {
      title: "Cross-functional Translation",
      description: "在商業目標、產品方向與技術限制之間建立共同語言，幫團隊往前走。",
    },
  ];
  const method = [
    "先定義問題，而不是先堆功能。",
    "用文件和情境把需求變成可執行決策。",
    "把 AI 協作嵌進工作流，縮短從想法到落地的距離。",
    "用輸出品質、採用情境與後續維護性來驗證產品價值。",
  ];

  return (
    <div className="space-y-20">
      <section className="space-y-8 border-b border-border/70 pb-10">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Amber Chang / AI-native product portfolio</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            我用 AI-native workflow
            <br />
            把模糊需求轉成可落地的產品、流程與案例。
          </h1>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.7fr_1fr] md:items-end">
          <div className="space-y-4 text-base leading-8 text-foreground/88">
            <p>
              我在媒體科技與 AI 產品情境中做產品工作，關心的不只是功能做出來，而是需求是否被定義清楚、流程是否可被團隊接住、產品是否真的進入使用場景。
            </p>
            <p className="text-muted-foreground">
              這裡同時放我的代表案例與公開筆記。前者用來證明我怎麼做事，後者用來呈現我如何思考、判斷與持續修正方法。
            </p>
          </div>

          <div className="space-y-4 border-l border-border/70 pl-0 md:pl-6">
            <p className="text-sm text-muted-foreground">目前聚焦</p>
            <ul className="space-y-2 text-sm leading-6 text-foreground/80">
              <li>AI-native product building</li>
              <li>MarTech / member growth</li>
              <li>PRD, SPEC, context-driven execution</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {outcomes.map((outcome) => (
          <div key={outcome} className="rounded-2xl border border-border/70 bg-muted/25 p-5">
            <p className="text-sm leading-7 text-foreground/85">{outcome}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-wide text-muted-foreground">Why Me</p>
          <h2 className="text-2xl font-semibold leading-tight">不是單一職能，而是一組可以一起工作的能力。</h2>
        </div>
        <div className="space-y-4">
          {capabilityStack.map((item) => (
            <div key={item.title} className="border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
              <h3 className="text-base font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium tracking-wide text-muted-foreground">Selected Work</p>
            <h2 className="text-2xl font-semibold">代表案例</h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              這些案例不是功能展示，而是我如何定義問題、拆解決策、用 AI-native workflow 推動落地的證據。
            </p>
          </div>
          <Link href="/projects" className="shrink-0 text-sm underline underline-offset-4 hover:text-foreground">
            看全部案例
          </Link>
        </div>

        <div className="space-y-4">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((project) => <ProjectCard key={project.slug} project={project} />)
          ) : (
            <p className="text-sm text-muted-foreground">目前還沒有公開案例。</p>
          )}
        </div>
      </section>

      <section className="grid gap-10 border-y border-border/70 py-10 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-wide text-muted-foreground">How I Build</p>
          <h2 className="text-2xl font-semibold">我會怎麼把事情做成</h2>
        </div>
        <ol className="space-y-4 text-sm leading-7 text-muted-foreground">
          {method.map((step, index) => (
            <li key={step} className="grid grid-cols-[2rem_1fr] gap-4">
              <span className="text-foreground/70">{String(index + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium tracking-wide text-muted-foreground">Featured Writing</p>
            <h2 className="text-2xl font-semibold">精選文章</h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              我用文章整理自己在 AI 協作、產品定義與實作現場裡的觀察，讓做法和判斷可以被看見。
            </p>
          </div>
          <Link href="/blog" className="shrink-0 text-sm underline underline-offset-4 hover:text-foreground">
            看全部文章
          </Link>
        </div>

        <div className="space-y-3">
          {latestPosts.length > 0 ? (
            latestPosts.map((post) => <PostCard key={post.slug} post={post} />)
          ) : (
            <p className="text-sm text-muted-foreground">目前還沒有精選文章，敬請期待。</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-muted-foreground">Contact</p>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          如果你正在找一位能把需求、規格、AI 協作與落地串起來的產品夥伴，歡迎來信聊聊。
        </p>
        <a
          href="mailto:amber@yourdomain.com"
          className="inline-block underline decoration-muted-foreground/70 underline-offset-4 hover:text-foreground"
        >
          amber@yourdomain.com
        </a>
      </section>
    </div>
  );
}
