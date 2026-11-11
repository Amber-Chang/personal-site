// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站根版面，統一注入 Header、Footer 與基礎 metadata。

import type { Metadata } from "next";
import { AnalyticsConsentBanner } from "@/components/AnalyticsConsentBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { readSiteUrl } from "@/lib/infra/supabase/env";
import "./globals.css";

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
    <html lang="zh-Hant">
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6 md:py-14">{children}</main>
        <Footer />
        <AnalyticsConsentBanner />
      </body>
    </html>
  );
}
