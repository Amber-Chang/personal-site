// 功能：公開頁的按鈕樣式（SPEC-004）。主要按鈕黑底白字、次要按鈕細外框；一個畫面最多一個主要按鈕。
// 都是小圓角、可點高度 44px、鍵盤焦點用赤陶外框。用在連結（<Link>、<a>）上。

const baseButtonClassName =
  "focus-ring inline-flex min-h-11 items-center rounded-control border px-4 text-sm font-medium transition-colors";

export const primaryButtonClassName = `${baseButtonClassName} border-foreground bg-foreground text-background hover:bg-foreground-soft`;

export const secondaryButtonClassName = `${baseButtonClassName} border-border text-foreground hover:border-foreground`;
