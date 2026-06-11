// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：關於我頁面，說明 Amber 的背景、觀點與合作方式。

import Link from "next/link";
import type { Metadata } from "next";

const workMethod = [
  "先把問題說清楚",
  "再把脈絡理順",
  "把想法推進成做法",
  "邊做邊修正",
];

export const metadata: Metadata = {
  title: "About / 關於我 — Amber Chang",
  description: "用產品思維、系統理解與寫作，整理工作現場與生活裡那些還說不清楚的問題。",
  openGraph: {
    title: "About / 關於我 — Amber Chang",
    description: "用產品思維、系統理解與寫作，整理工作現場與生活裡那些還說不清楚的問題。",
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <header className="space-y-2">
        <Link href="/" className="inline-block text-sm text-muted-foreground hover:underline">
          ← 返回首頁
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-[2.25rem] font-semibold tracking-[-0.03em] md:text-[2.6rem]">
          About / 關於我
        </h1>
      </header>

      <article className="prose prose-neutral max-w-none text-[1.02rem] leading-8 prose-headings:font-[family-name:var(--font-display)] prose-headings:tracking-[-0.03em] prose-h2:mt-12 prose-h2:text-[1.8rem] prose-h2:font-semibold prose-p:text-foreground/88 prose-p:leading-8 prose-li:leading-8 md:text-[1.06rem] md:prose-h2:text-[2rem]">
        <p>
          我是 Amber。平常用產品思維、系統理解與寫作，整理工作現場與生活裡那些還說不清楚的問題。
        </p>
        <p>
          我在媒體科技產業做產品工作，這些年越來越在意的是：在資源與時間都有限的情況下，怎麼把模糊需求整理成可以被討論、驗證與推進的方向。
        </p>
        <p>
          我開始把 AI 當成工作流程的一部分，不是為了追工具潮流，而是希望把思考、驗證、溝通和實作串得更緊，讓每個決策更可追溯。這個網站也因此成了我的公開筆記，記錄專案裡的判斷、踩過的坑，以及一些從工作延伸到生活的觀察。
        </p>
      <h2>How I Work</h2>
      <p>我通常不是先急著找答案，而是先找到比較對的理解方式。</p>
      <ol>
        {workMethod.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <h2>我在意什麼</h2>
      <ul>
        <li>需求要回到使用者與商業目標，不是功能清單。</li>
        <li>技術決策要可維護，不追短期漂亮解法。</li>
        <li>流程要可被團隊複用，而不是只靠個人英雄主義。</li>
      </ul>
      <p>
        如果你也在找一位能把策略、需求與落地串起來的產品夥伴，歡迎來信：
        <a href="mailto:taco5239@gmail.com">taco5239@gmail.com</a>
      </p>
      </article>
    </div>
  );
}
