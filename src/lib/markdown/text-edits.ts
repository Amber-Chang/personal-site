// 功能：Markdown 內容欄位的文字編輯工具。編輯結果一律用 { value, selectionStart, selectionEnd } 表示，
// 實際寫回 textarea 時再算出「哪一段被換掉」，讓瀏覽器的復原（Cmd/Ctrl+Z）可以一步還原。

export type TextEditState = {
  selectionEnd: number;
  selectionStart: number;
  value: string;
};

// 比對編輯前後的文字，找出被換掉的範圍：before 的 [start, end) 換成 text 就會得到 after。
// 只比對頭尾相同的部分，不是最小差異演算法；對單次插入、包住或去掉前綴這類編輯已經足夠。
export function getTextReplacement(before: string, after: string): { end: number; start: number; text: string } {
  const maxPrefix = Math.min(before.length, after.length);
  let prefix = 0;

  while (prefix < maxPrefix && before[prefix] === after[prefix]) {
    prefix += 1;
  }

  const maxSuffix = Math.min(before.length, after.length) - prefix;
  let suffix = 0;

  while (suffix < maxSuffix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) {
    suffix += 1;
  }

  return {
    end: before.length - suffix,
    start: prefix,
    text: after.slice(prefix, after.length - suffix),
  };
}
