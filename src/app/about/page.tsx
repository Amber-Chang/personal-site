// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：關於我頁面，說明 Amber 的背景、觀點與合作方式。

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "關於我 — Amber Chang",
  description: "PM × AI Builder。用 AI 槓桿出更大效益，朝 builder 之路邁進。",
  openGraph: {
    title: "關於我 — Amber Chang",
    description: "PM × AI Builder。用 AI 槓桿出更大效益，朝 builder 之路邁進。",
  },
};

export default function AboutPage() {
  return (
    <article className="prose prose-neutral max-w-none">
      <h1>關於我</h1>
      <p>
        我是 Amber，在媒體科技產業做產品工作。這些年我越來越在意一件事：
        在資源和時間都有限的情況下，產品人到底怎麼把價值做大。
      </p>
      <p>
        我開始把 AI 當成工作流程的一部分，不是為了追工具潮流，而是希望把思考、驗證、溝通和實作串得更緊，讓每個決策更可追溯。
      </p>
      <p>
        這個網站就是我的公開筆記：我會記錄專案裡的判斷、踩過的坑、和我如何把模糊需求轉成可執行的任務。
      </p>
      <h2>我在意什麼</h2>
      <ul>
        <li>需求要回到使用者與商業目標，不是功能清單。</li>
        <li>技術決策要可維護，不追短期漂亮解法。</li>
        <li>流程要可被團隊複用，而不是只靠個人英雄主義。</li>
      </ul>
      <p>
        如果你也在找一位能把策略、需求與落地串起來的產品夥伴，歡迎來信：
        <a href="mailto:amber@yourdomain.com">amber@yourdomain.com</a>
      </p>
    </article>
  );
}
