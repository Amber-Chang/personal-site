// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：關於我頁面，說明 Amber 的背景、觀點與合作方式。

import Link from "next/link";
import type { Metadata } from "next";
import { PostHogPageView } from "@/components/PostHogPageView";
import { createPageViewProperties } from "@/lib/analytics/pageview";

export const metadata: Metadata = {
  title: "About / 關於我 — Amber Chang",
  description: "AI-native Product Builder，擅長把模糊需求、系統脈絡與有限資源整理成可被討論、驗證與推進的產品方案。",
  openGraph: {
    title: "About / 關於我 — Amber Chang",
    description: "AI-native Product Builder，擅長把模糊需求、系統脈絡與有限資源整理成可被討論、驗證與推進的產品方案。",
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <PostHogPageView
        properties={createPageViewProperties({
          contentType: "about",
          sourceTemplate: "about",
        })}
      />
      <header className="space-y-2">
        <Link href="/" className="inline-block text-sm text-muted-foreground hover:underline">
          ← 返回首頁
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-[2.25rem] font-semibold tracking-[-0.03em] md:text-[2.6rem]">
          關於我
        </h1>
      </header>

      <article className="prose prose-neutral max-w-none text-[1.02rem] leading-8 prose-headings:font-[family-name:var(--font-display)] prose-headings:tracking-[-0.03em] prose-h2:mt-12 prose-h2:text-[1.8rem] prose-h2:font-semibold prose-p:text-foreground/88 prose-p:leading-8 prose-li:leading-8 md:text-[1.06rem] md:prose-h2:text-[2rem]">
        <p>我是 Amber，一位 AI-native Product Builder。</p>
        <p>我擅長把模糊需求、系統脈絡與有限資源，整理成可以被討論、驗證與推進的產品方案。</p>
        <p>
          過去我從教育現場、BD／產品規劃，到現在在媒體產業負責會員系統、MarTech 與支援營運流程的平台型產品。這些經驗讓我習慣從使用者、商業目標、流程限制與技術條件之間，找出真正需要被解決的問題。
        </p>
        <p>
          我把 AI 視為工作流程的一部分，不是為了追逐工具，而是為了放大產品人的判斷力：更快整理脈絡、更快驗證想法、更快設計流程，也更快把想法推進成可被使用的成果。
        </p>
        <h2>我擅長處理的問題</h2>
        <ul>
          <li>把模糊需求整理成可以被討論、驗證與推進的產品方向</li>
          <li>釐清使用者、商業目標、流程限制與技術條件之間的關係</li>
          <li>將分散的工具、資料與流程，整理成可複用的平台能力</li>
          <li>在有限資源下，找出可落地的執行路徑，並逐步推進成果</li>
          <li>透過 AI 協作加速研究、規格整理、流程設計與可運行成果的產出</li>
        </ul>
        <p>這裡記錄我做過的產品專案，也記錄我在工作、AI 協作與日常生活中的觀察。</p>
        <p>
          對我來說，產品思考不只存在於功能、流程與規格裡，也存在於人如何理解問題、做出選擇，並與系統互動的過程中。很多生活裡的片刻，最後也會回到我對人、產品與系統的理解。
        </p>
        <p>如果你正在尋找能把策略、需求與落地串起來的產品夥伴，歡迎來信。</p>
      </article>
    </div>
  );
}
