// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：案例列表頁，顯示已發布的代表專案。

import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { getPublicBlogContentService } from "../blog/blog-context";
import { loadProjectsPageData } from "./data";

export const metadata: Metadata = {
  title: "專案 — Amber Chang",
  description: "Amber 的代表專案與案例：AI-native 產品、MarTech、內容與流程建構。",
  openGraph: {
    title: "專案 — Amber Chang",
    description: "Amber 的代表專案與案例：AI-native 產品、MarTech、內容與流程建構。",
  },
};

export const revalidate = 0;

export default async function ProjectsPage() {
  const { projects } = await loadProjectsPageData({
    service: getPublicBlogContentService(),
  });

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">專案</h1>
        <p className="text-sm text-muted-foreground">
          我如何把模糊需求轉成產品方向、可執行規格與真正能落地的成果。
        </p>
      </header>

      <div className="space-y-5 md:space-y-6">
        {projects.length > 0 ? (
          projects.map((project) => <ProjectCard key={project.slug} project={project} />)
        ) : (
          <p className="text-sm text-muted-foreground">目前還沒有公開案例。</p>
        )}
      </div>
    </div>
  );
}
