import { AdminProjectForm } from "../../../../components/admin/project-form.tsx";
import { createAdminProjectAction } from "../actions.ts";
import { getAdminPageContentService } from "../../posts/admin-context.ts";

export const dynamic = "force-dynamic";

export default async function NewAdminProjectPage() {
  await getAdminPageContentService();

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col px-6 py-16">
      <AdminProjectForm
        action={createAdminProjectAction}
        description="建立新的 project，讓它可被文章關聯，並直接成為前台 `/projects`、案例頁與首頁代表案例的來源。"
        submitLabel="建立專案"
        title="新增專案"
        values={{
          contentMarkdown: "",
          featured: false,
          outcomes: "",
          period: "",
          role: "",
          slug: "",
          status: "draft",
          summary: "",
          tags: "",
          title: "",
        }}
      />
    </main>
  );
}
