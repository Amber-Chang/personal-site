// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：全站根版面，統一注入 Header、Footer 與基礎 metadata。

import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amber Chang | Personal Site",
  description: "一個正在學著用 AI 槓桿出更大效益、朝 builder 之路邁進的 PM。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">
        <Header />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-14">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
