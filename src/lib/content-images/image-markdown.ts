// 功能：後台「上傳圖片」區塊的純邏輯：送出前的檢查、替代文字處理、圖片語法與插入位置。
// 不碰瀏覽器 API，方便測試；畫面與上傳流程在 src/components/admin/content-image-upload.tsx。

import type { TextEditState } from "../markdown/text-edits.ts";
import { getContentImageSizeError, getContentImageTypeError } from "./rules.ts";

export const CONTENT_IMAGE_FILE_REQUIRED_ERROR = "請先選擇要上傳的圖片。";
export const CONTENT_IMAGE_ALT_REQUIRED_ERROR = "請輸入圖片的替代文字。";

// 選檔後、送出前就檢查：有沒有選檔 → 類型 → 大小。和伺服器端用同一套規則與訊息。
export function getContentImageFileError(file: { size: number; type: string } | null): string | null {
  if (!file) {
    return CONTENT_IMAGE_FILE_REQUIRED_ERROR;
  }

  return getContentImageTypeError(file.type) ?? getContentImageSizeError(file.size);
}

export function getContentImageAltError(alt: string): string | null {
  return alt.trim() ? null : CONTENT_IMAGE_ALT_REQUIRED_ERROR;
}

// 替代文字放進 ![替代文字](網址) 前的處理：換行變成空白、連續空白合併，
// 反斜線與 [ ] 前面加反斜線，避免提早結束方括號或吃掉後面的符號。
export function escapeImageAlt(alt: string): string {
  return alt
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\[\]]/g, (character) => `\\${character}`);
}

// 網址裡的空白與括號會弄壞 ( ) 的範圍，先轉成百分比編碼。伺服器產生的公開網址本來就不含這些字元。
const URL_CHARACTER_ESCAPES: Record<string, string> = { "(": "%28", ")": "%29" };

function encodeImageUrl(url: string): string {
  return url.replace(/[\s()]/g, (character) => URL_CHARACTER_ESCAPES[character] ?? encodeURIComponent(character));
}

export function createImageMarkdown(alt: string, url: string): string {
  return `![${escapeImageAlt(alt)}](${encodeImageUrl(url)})`;
}

// 插入位置：有游標時放在游標處（有選取文字時放在選取範圍後面，不刪掉選取的文字）；
// 沒有游標時（還沒點過內容欄位）加在最後，前面空一行，成為獨立段落。插入後游標移到圖片語法後面。
export function insertImageMarkdown(input: TextEditState & { hasCursor: boolean }, markdown: string): TextEditState {
  if (input.hasCursor) {
    const position = Math.max(input.selectionStart, input.selectionEnd);
    const value = input.value.slice(0, position) + markdown + input.value.slice(position);
    const caret = position + markdown.length;

    return { selectionEnd: caret, selectionStart: caret, value };
  }

  const separator = input.value === "" || input.value.endsWith("\n\n") ? "" : input.value.endsWith("\n") ? "\n" : "\n\n";
  const value = input.value + separator + markdown;

  return { selectionEnd: value.length, selectionStart: value.length, value };
}
