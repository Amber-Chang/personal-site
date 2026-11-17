// 功能：後台內容變更成功後呼叫，讓全站公開頁與 sitemap.xml 立即標記為需要更新（SPEC-005）。
// 公開頁是預先產生的；標記後，下一次有人瀏覽時 Next.js 重新產生該頁，讀到新內容（取消發佈或刪除的內頁變成 404）。
// revalidatePath("/", "layout") 涵蓋根版面底下的所有頁面，包括動態網址的文章與案例內頁；
// sitemap.xml 也在根版面底下，另外明確列出，讓意圖清楚。

type RevalidatePath = (path: string, type?: "layout" | "page") => void;

export function revalidatePublicPages(revalidatePath: RevalidatePath) {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}
