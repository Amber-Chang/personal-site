import { notFound } from "next/navigation";

import { AdminPostForm } from "../../../../components/admin/post-form.tsx";
import { updateAdminPostAction } from "../actions.ts";
import { getAdminPageContentService } from "../admin-context.ts";
import { loadAdminPostEditPageData } from "../data.ts";

export const dynamic = "force-dynamic";

export default async function EditAdminPostPage(input: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await input.params;
  const service = await getAdminPageContentService();
  const data = await loadAdminPostEditPageData({
    id,
    service,
  });

  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col px-6 py-16">
      <AdminPostForm
        action={updateAdminPostAction}
        description="調整既有文章的最小欄位集，內容仍走目前的 markdown skeleton。"
        projectOptions={data.projectOptions}
        submitLabel="儲存變更"
        title="編輯文章"
        values={{
          contentMarkdown: data.post.contentMarkdown,
          excerpt: data.post.excerpt ?? "",
          id: data.post.id,
          relatedProjectId: data.post.relatedProjectId ?? "",
          slug: data.post.slug,
          status: data.post.status,
          title: data.post.title,
        }}
      />
    </main>
  );
}
