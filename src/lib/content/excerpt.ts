// 功能：整理首頁精選文章的摘要（純函式，方便單元測試）。
// 後台存的摘要可能有換行（含 CRLF）、連續空白，也可能很長；首頁卡片只需要一段乾淨的短句。

export const HOME_EXCERPT_MAX_LENGTH = 80;

// 中日韓文字與全形標點：這些字之間的換行直接接起來，不補空白。
const CJK_CHARACTER = /[⺀-鿿豈-﫿︰-﹏＀-￯]/u;
// 截斷處不留這些標點，避免出現「，…」。
const TRAILING_PUNCTUATION = /[\s,，、;；:：]+$/u;

function collapseWhitespace(value: string): string {
  return value
    .replace(/\s+/gu, (run, offset: number, whole: string) => {
      const before = whole[offset - 1] ?? "";
      const after = whole[offset + run.length] ?? "";
      const hasLineBreak = /[\r\n]/u.test(run);

      return hasLineBreak && CJK_CHARACTER.test(before) && CJK_CHARACTER.test(after) ? "" : " ";
    })
    .trim();
}

// 沒有摘要時回傳 null，讓卡片只顯示標題。maxLength 以字元（code point）計算，不會切壞 emoji。
export function normalizeExcerpt(value: string | null | undefined, maxLength = HOME_EXCERPT_MAX_LENGTH): string | null {
  const collapsed = collapseWhitespace(value ?? "");

  if (!collapsed) {
    return null;
  }

  const characters = Array.from(collapsed);

  if (characters.length <= maxLength) {
    return collapsed;
  }

  return `${characters.slice(0, maxLength).join("").replace(TRAILING_PUNCTUATION, "")}…`;
}
