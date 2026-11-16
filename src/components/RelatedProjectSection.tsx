// 功能：文章內頁底部的「相關案例」（SPEC-004）：和延伸閱讀同一種樣式，顯示案例標題與「類型 · 角色」。
// 沒有關聯案例，或關聯的案例已下架時不顯示。

import Link from "next/link";

type RelatedProject = {
  role: string | null;
  slug: string;
  summary: string;
  title: string;
  typeLabel: string | null;
} | null;

export function RelatedProjectSection({ relatedProject }: { relatedProject: RelatedProject }) {
  if (!relatedProject) {
    return null;
  }

  const meta = [relatedProject.typeLabel, relatedProject.role].filter(Boolean).join(" · ");

  return (
    <section aria-labelledby="related-project-heading" className="mt-14 border-t border-foreground pt-3.5">
      <h2 className="text-base font-semibold" id="related-project-heading">
        相關案例
      </h2>
      <Link className="group focus-ring mt-1 block border-b border-border py-3.5" href={`/projects/${relatedProject.slug}`}>
        <span className="block font-semibold underline-offset-4 decoration-2 group-hover:underline decoration-terracotta">
          {relatedProject.title}
        </span>
        {meta ? <span className="mt-0.5 block text-label tracking-label text-muted-foreground">{meta}</span> : null}
      </Link>
    </section>
  );
}
