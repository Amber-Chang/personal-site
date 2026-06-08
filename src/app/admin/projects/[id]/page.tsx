import { notFound } from "next/navigation";

import { AdminProjectForm } from "../../../../components/admin/project-form.tsx";
import { updateAdminProjectAction } from "../actions.ts";
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
        description="調整 project identity 的最小欄位集，讓文章關聯與前台路由維持一致。"
        submitLabel="儲存變更"
        title="編輯專案"
        values={{
          id: data.project.id,
          slug: data.project.slug,
          status: data.project.status,
          summary: data.project.summary ?? "",
          title: data.project.title,
        }}
      />
    </main>
  );
}
