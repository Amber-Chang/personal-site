// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：首頁，呈現個人定位、精選文章與聯絡資訊。

import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { getFeaturedPosts } from "@/lib/posts";

export default function HomePage() {
  const featuredPosts = getFeaturedPosts();

  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">Amber 的個人品牌網站</p>
        <h1 className="text-2xl font-semibold leading-snug md:text-3xl">
          我是 Amber，一個正在學著用 AI 槓桿出更大效益、朝 builder 之路邁進的 PM。
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          這裡會持續記錄我在 AI 協作、產品思考與工作現場裡的觀察，讓潛在合作夥伴快速理解我的判斷方式與做事風格。
        </p>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground">精選文章</h2>
          <Link href="/blog" className="text-sm underline underline-offset-4 hover:text-foreground">
            看全部
          </Link>
        </div>
        <div className="space-y-3">
          {featuredPosts.length > 0 ? (
            featuredPosts.map((post) => <PostCard key={post.slug} post={post} />)
          ) : (
            <p className="text-sm text-muted-foreground">目前還沒有精選文章，敬請期待。</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground">聯絡</h2>
        <a
          href="mailto:amber@yourdomain.com"
          className="underline decoration-muted-foreground/70 underline-offset-4 hover:text-foreground"
        >
          amber@yourdomain.com
        </a>
      </section>
    </div>
  );
}
