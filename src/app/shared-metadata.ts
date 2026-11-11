// 功能：各頁共用的 metadata 片段。
// Next.js 的 metadata 是淺層合併：子頁自己宣告 openGraph 時，會整個蓋掉上層的 openGraph（含分享圖），
// 所以有宣告 openGraph 的頁面要把這個物件展開進去，分享圖才不會消失。

export const siteOgImage = {
  alt: "Amber Chang — AI-native Product Builder",
  height: 630,
  url: "/opengraph-image",
  width: 1200,
};

export const sharedOpenGraph = {
  images: [siteOgImage],
};
