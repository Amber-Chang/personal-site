// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：關於我頁面，說明 Amber 的背景、觀點與合作方式。

import Link from "next/link";
import type { Metadata } from "next";

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
          關於我
        </h1>
      </header>

      <article className="prose prose-neutral max-w-none text-[1.02rem] leading-8 prose-headings:font-[family-name:var(--font-display)] prose-headings:tracking-[-0.03em] prose-h2:mt-12 prose-h2:text-[1.8rem] prose-h2:font-semibold prose-p:text-foreground/88 prose-p:leading-8 prose-li:leading-8 md:text-[1.06rem] md:prose-h2:text-[2rem]">
        <p>
          我是 Amber，一位 AI-native Product Builder。
        </p>
        <p>
          我擅長把模糊需求、系統脈絡與有限資源，整理成可以被討論、驗證與推進的產品方案。
        </p>
        <p>
          過去我從教育現場、BD／產品規劃，到現在在媒體科技產業負責會員系統、MarTech 與內部平台。這些經驗讓我習慣從使用者、商業目標、流程限制與技術條件之間，找出真正需要被解決的問題。
        </p>
        <p>
          我把 AI 視為工作流程的一部分，不是為了追逐工具，而是為了放大產品人的判斷力：更快整理脈絡、更快驗證想法、更快產出原型，也讓決策過程更可追溯。
        </p>
        <h2>我目前關注</h2>
        <ul>
          <li>MarTech / CRM / CDP</li>
          <li>會員系統與身份整合</li>
          <li>Internal SaaS</li>
          <li>AI-assisted workflow</li>
        </ul>
        <p>這個網站記錄我做過的專案，也記錄我如何把模糊需求轉成可執行的產品任務。</p>
        <p>如果你正在尋找能把策略、需求與落地串起來的產品夥伴，歡迎來信。</p>
      </article>
    </div>
  );
}
