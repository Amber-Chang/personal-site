import { AdminPostForm } from "../../../../components/admin/post-form.tsx";
import { createAdminPostAction } from "../actions.ts";
import { getAdminPageContentService } from "../admin-context.ts";
import { loadAdminPostCreatePageData } from "../data.ts";

export default async function NewAdminPostPage() {
  const service = await getAdminPageContentService();
  const { projectOptions } = await loadAdminPostCreatePageData({
    service,
  });

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col px-6 py-16">
      <AdminPostForm
        action={createAdminPostAction}
        description="建立一篇新的 blog post 草稿，先填最小欄位，之後再回來補內容。"
        projectOptions={projectOptions}
        submitLabel="建立草稿"
        title="新增文章"
        values={{
          contentMarkdown: "",
          excerpt: "",
          relatedProjectId: "",
          slug: "",
          status: "draft",
          title: "",
        }}
      />
    </main>
  );
}
