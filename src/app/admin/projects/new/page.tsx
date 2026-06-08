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
        description="建立新的 project identity，讓文章可以關聯到它；完整案例內容仍維持目前 Markdown source。"
        submitLabel="建立專案"
        title="新增專案"
        values={{
          slug: "",
          status: "draft",
          summary: "",
          title: "",
        }}
      />
    </main>
  );
}
