// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：案例列表頁，顯示已發布的代表專案。

import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { getPublicBlogContentService } from "../blog/blog-context";
import { loadProjectsPageData } from "./data";

export const metadata: Metadata = {
  title: "專案 — Amber Chang",
  description: "一些我如何理解問題、整理脈絡，並把它們推進成產品成果的紀錄。",
  openGraph: {
    title: "專案 — Amber Chang",
    description: "一些我如何理解問題、整理脈絡，並把它們推進成產品成果的紀錄。",
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
          這裡收的是一些我如何理解問題、整理脈絡，並把它們推進成產品成果的紀錄。
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
        {projects.length > 0 ? (
          projects.map((project) => <ProjectCard key={project.slug} project={project} />)
        ) : (
          <p className="text-sm text-muted-foreground">目前還沒有公開案例。</p>
        )}
      </div>
    </div>
  );
}
