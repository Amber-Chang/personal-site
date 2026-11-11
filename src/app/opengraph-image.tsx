// 功能：全站社群分享圖（1200×630），連結貼到 LinkedIn、Slack 時顯示的預覽圖。
// 字型用 repo 內的 Noto Serif 拉丁子集（OFL，見 src/assets/fonts/OFL.txt），build 不需要連網。
// 圖上只放拉丁字；若要放中文，需另外打包含中文字的字型檔。

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteOgImage } from "./shared-metadata";

export const alt = siteOgImage.alt;
export const size = { width: siteOgImage.width, height: siteOgImage.height };
export const contentType = "image/png";

// 與 globals.css 的 --background、--foreground、--muted-foreground、--accent 對應（oklch 轉 sRGB）。
const colors = {
  accent: "#eaf1fa",
  background: "#fbfaf7",
  foreground: "#0f1216",
  mutedForeground: "#5f6772",
};

const fontDirectory = join(process.cwd(), "src/assets/fonts");

export default async function OpenGraphImage() {
  const [serifRegular, serifSemiBold] = await Promise.all([
    readFile(join(fontDirectory, "noto-serif-latin-400-normal.woff")),
    readFile(join(fontDirectory, "noto-serif-latin-600-normal.woff")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: colors.background,
          backgroundImage: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.background} 55%)`,
          color: colors.foreground,
          display: "flex",
          flexDirection: "column",
          fontFamily: "Noto Serif",
          height: "100%",
          justifyContent: "center",
          padding: "0 112px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 120, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Amber Chang
        </div>
        <div style={{ backgroundColor: colors.foreground, display: "flex", height: 3, marginTop: 44, width: 96 }} />
        <div style={{ color: colors.mutedForeground, display: "flex", fontSize: 48, fontWeight: 400, marginTop: 40 }}>
          AI-native Product Builder
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { data: serifRegular, name: "Noto Serif", style: "normal", weight: 400 },
        { data: serifSemiBold, name: "Noto Serif", style: "normal", weight: 600 },
      ],
    },
  );
}
