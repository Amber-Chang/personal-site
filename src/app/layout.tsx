// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站根版面，統一注入 Header、Footer 與基礎 metadata。

import type { Metadata } from "next";
import { Noto_Serif_TC } from "next/font/google";
import { AnalyticsConsentBanner } from "@/components/AnalyticsConsentBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { readSiteUrl } from "@/lib/infra/supabase/env";
import "./globals.css";

// 標題字體（PM 決策 D2）：只載 Noto Serif TC 600 字重，build 時下載並由本站自行提供。
// 中文字依 unicode-range 切成多個小檔，瀏覽器只下載頁面上實際用到的字；預先載入只針對拉丁字母子集。
const notoSerifTC = Noto_Serif_TC({
  weight: "600",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-serif-tc",
});

// 社群分享圖、sitemap 等絕對網址的基準。缺少站點網址時交給 Next.js 預設值，不讓 build 失敗。
const siteUrl = readSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl && URL.canParse(siteUrl) ? new URL(siteUrl) : undefined,
  title: "Amber Chang | Personal Site",
  description: "一個正在學著用 AI 槓桿出更大效益、朝 builder 之路邁進的 PM。",
  icons: {
    icon: "/amber-avatar.png",
    shortcut: "/amber-avatar.png",
    apple: "/amber-avatar.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={notoSerifTC.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6 md:py-14">{children}</main>
        <Footer />
        <AnalyticsConsentBanner />
      </body>
    </html>
  );
}
