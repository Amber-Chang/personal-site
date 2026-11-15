// 功能：把 mermaid 區塊的原始碼畫成 SVG 圖表的流程與設定。由 MermaidDiagram 元件在瀏覽器端呼叫。
// Mermaid 程式本身由呼叫端用 loadMermaid 傳入（元件裡是動態載入），這個檔案只引用 mermaid 的型別，不載入程式，方便測試。

import type { MermaidConfig } from "mermaid";

export const MERMAID_ERROR_MESSAGE = "這張圖表的語法有誤，無法顯示。";

// 圖表寬度：沿用 Mermaid 預設的 useMaxWidth（SVG 寬度 100%、最大不超過原尺寸），
// 所以比內容欄寬的圖會縮到欄寬，桌機讀者不用捲動就看得到整張圖；圖表不會被放大超過原尺寸。
// 為了讓手機上的字還看得清楚，圖表另外有最小寬度＝原尺寸的 80%，但最多 45rem（720px）；
// 欄寬比最小寬度窄時（手機、後台並排預覽），在自己的容器內左右捲動。
// 這樣原尺寸比欄寬窄的圖照原尺寸顯示、不被撐大；只比手機欄寬寬一點的圖縮進欄內，不會多出幾 px 的捲動。
export const MERMAID_READABLE_MIN_WIDTH_PX = 720;
export const MERMAID_MIN_SCALE = 0.8;

// Mermaid 預設的 secure 清單（12.2）：這些設定只能由 initialize 決定，圖表裡的 %%{init}%% 指令改不了。
const MERMAID_DEFAULT_SECURE_KEYS = ["secure", "securityLevel", "startOnLoad", "maxTextSize", "suppressErrorRendering", "maxEdges"];

export const MERMAID_CONFIG: MermaidConfig = {
  // 最嚴格的安全等級：腳本與點擊事件都不會執行。
  securityLevel: "strict",
  // 只靠 strict 時，Mermaid 12 仍會把標籤裡的 <a>、<img>、<button> 清理後保留下來（2026-11-15 本機實測）。
  // 改成純 SVG 文字標籤：標籤裡的 HTML 只會顯示成文字，也不會套到長文樣式。
  htmlLabels: false,
  // 把 htmlLabels 與 HTML 清理規則也鎖住，避免圖表內的 init 指令把 HTML 標籤打開。
  secure: [...MERMAID_DEFAULT_SECURE_KEYS, "htmlLabels", "dompurifyConfig"],
  // 不讓 Mermaid 自己掃描整頁；只畫元件交給它的區塊。
  startOnLoad: false,
  // 語法錯誤時不讓 Mermaid 在頁面上插入它自己的錯誤圖示，改由元件顯示中文提示。
  suppressErrorRendering: true,
};

export type MermaidApi = {
  initialize: (config: MermaidConfig) => void;
  parse: (text: string) => Promise<unknown>;
  render: (id: string, text: string) => Promise<{ svg: string }>;
};

export type MermaidRenderResult = { minWidth: number | null; status: "ready"; svg: string } | { status: "error" };

// 從最外層 <svg> 讀出圖表的原尺寸寬度：優先用 viewBox 的寬，沒有時用 Mermaid 寫的 max-width。
export function getSvgNaturalWidth(svg: string): number | null {
  const rootTag = svg.match(/^\s*<svg\b[^>]*>/)?.[0];

  if (!rootTag) {
    return null;
  }

  const viewBoxWidth = Number(rootTag.match(/\bviewBox="([^"]*)"/)?.[1].trim().split(/[\s,]+/)[2]);

  if (Number.isFinite(viewBoxWidth) && viewBoxWidth > 0) {
    return viewBoxWidth;
  }

  const maxWidth = Number(rootTag.match(/max-width:\s*([\d.]+)px/)?.[1]);

  return Number.isFinite(maxWidth) && maxWidth > 0 ? maxWidth : null;
}

// 圖表的最小寬度：原尺寸的 80%，最多 45rem；讀不到原尺寸時不設（交給欄寬）。
export function getMermaidMinWidth(naturalWidth: number | null): number | null {
  if (naturalWidth === null) {
    return null;
  }

  return Math.min(MERMAID_READABLE_MIN_WIDTH_PX, Math.round(naturalWidth * MERMAID_MIN_SCALE));
}

// click 指令與 link 語法會讓 Mermaid 產生 <a> 連結；拿掉連結標籤、保留裡面的圖形與文字，圖表內就沒有可點擊的連結。
// 就算某個屬性值裡有「>」，開頭的「<a」仍會被拿掉，連結一樣不會成立。
function removeLinks(svg: string) {
  return svg.replace(/<a\b[^>]*>/gi, "").replace(/<\/a>/gi, "");
}

// Mermaid 會把 id 用在元素 id 與 CSS 選擇器；React useId 產生的冒號、角括號等字元要拿掉。
export function toMermaidElementId(reactId: string) {
  return `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export async function renderMermaidDiagram(input: {
  id: string;
  loadMermaid: () => Promise<MermaidApi>;
  source: string;
}): Promise<MermaidRenderResult> {
  try {
    const mermaid = await input.loadMermaid();

    mermaid.initialize(MERMAID_CONFIG);
    // 先檢查語法：有錯就直接回報，不進入繪製。
    await mermaid.parse(input.source);

    const { svg } = await mermaid.render(input.id, input.source);

    return { minWidth: getMermaidMinWidth(getSvgNaturalWidth(svg)), status: "ready", svg: removeLinks(svg) };
  } catch {
    // 語法錯誤、繪製失敗或程式載入失敗，都只影響這一張圖，頁面其他內容照常顯示。
    return { status: "error" };
  }
}
