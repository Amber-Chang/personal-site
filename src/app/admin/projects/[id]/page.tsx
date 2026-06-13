import { notFound } from "next/navigation";

import { AdminProjectForm } from "../../../../components/admin/project-form.tsx";
import { deleteAdminProjectAction, updateAdminProjectAction } from "../actions.ts";
import { getAdminPageContentService } from "../../posts/admin-context.ts";
import { loadAdminProjectEditPageData } from "../data.ts";

export const dynamic = "force-dynamic";

export default async function EditAdminProjectPage(input: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await input.params;
  const service = await getAdminPageContentService();
  const data = await loadAdminProjectEditPageData({
    id,
    service,
  });

  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col px-6 py-16">
      <AdminProjectForm
        action={updateAdminProjectAction}
        description="調整公開 project 內容，儲存後會直接影響前台 `/projects`、案例頁與首頁代表案例區塊。"
        deleteAction={deleteAdminProjectAction}
        submitLabel="儲存變更"
        title="編輯專案"
        values={{
          contentMarkdown: data.project.contentMarkdown ?? "",
          featured: data.project.featured,
          id: data.project.id,
          outcomes: data.project.outcomes.join("\n"),
          period: data.project.period ?? "",
          role: data.project.role ?? "",
          slug: data.project.slug,
          status: data.project.status,
          summary: data.project.summary ?? "",
          tags: data.project.tags.join(", "),
          title: data.project.title,
        }}
      />
    </main>
  );
}
