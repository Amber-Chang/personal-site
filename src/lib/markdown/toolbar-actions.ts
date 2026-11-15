// 功能：後台 Markdown 工具列每個按鈕的編輯規則。輸入、輸出都是 { value, selectionStart, selectionEnd }，
// 不碰瀏覽器，方便逐一測試；寫回 textarea 由 src/components/admin/textarea-edit.ts 負責（保留復原紀錄）。

import type { TextEditState } from "./text-edits.ts";

// ---- 行內：粗體、斜體、連結 ----

// 選取範圍頭尾的空白留在標記外面（例如雙擊選字時多選到的空白），避免變成無效的「** 文字 **」。
function splitSelection(state: TextEditState) {
  const selected = state.value.slice(state.selectionStart, state.selectionEnd);
  const leading = selected.length - selected.trimStart().length;
  const trailing = selected.length - selected.trimEnd().length;
  const start = state.selectionStart + (selected.trim() ? leading : 0);
  const end = state.selectionEnd - (selected.trim() ? trailing : 0);

  return { end, start, text: state.value.slice(start, end) };
}

function wrapSelection(state: TextEditState, marker: string, placeholder: string): TextEditState {
  const { end, start, text } = splitSelection(state);
  const inner = text || placeholder;
  const value = state.value.slice(0, start) + marker + inner + marker + state.value.slice(end);

  // 包好之後選取裡面的文字（沒有選取時選取預設文字），方便直接改寫。
  return { selectionEnd: start + marker.length + inner.length, selectionStart: start + marker.length, value };
}

export function wrapBold(state: TextEditState): TextEditState {
  return wrapSelection(state, "**", "粗體文字");
}

export function wrapItalic(state: TextEditState): TextEditState {
  return wrapSelection(state, "*", "斜體文字");
}

export function insertLink(state: TextEditState): TextEditState {
  const { end, start, text } = splitSelection(state);
  const label = text || "連結文字";
  const before = `${state.value.slice(0, start)}[${label}](`;
  const value = `${before}url)${state.value.slice(end)}`;

  // 選取 url，貼上網址就會直接取代。
  return { selectionEnd: before.length + 3, selectionStart: before.length, value };
}

// ---- 整行：標題、引言、清單 ----

type LineEdit = { newPrefix: string; oldPrefixLength: number };

type LineRange = { end: number; start: number };

// 選取範圍涵蓋的行（選取結尾剛好在下一行開頭時，不算那一行）。
function getSelectedLines(state: TextEditState): LineRange[] {
  const { selectionEnd, selectionStart, value } = state;
  const lines: LineRange[] = [];
  let lineStart = 0;

  for (const line of value.split("\n")) {
    lines.push({ end: lineStart + line.length, start: lineStart });
    lineStart += line.length + 1;
  }

  const effectiveEnd = selectionEnd > selectionStart && value[selectionEnd - 1] === "\n" ? selectionEnd - 1 : selectionEnd;

  return lines.filter((line) => line.end >= selectionStart && line.start <= effectiveEnd);
}

// 依每一行的前綴修改產生新內容，並把選取範圍跟著移動：
// 游標在前綴之後時跟著文字走；有選取且從行首開始時，保留在行首（整行都選起來）。
function editLines(state: TextEditState, getEdit: (line: string, index: number) => LineEdit | null): TextEditState {
  const lines = getSelectedLines(state);
  const edits = new Map<number, LineEdit>();

  lines.forEach((range, index) => {
    const edit = getEdit(state.value.slice(range.start, range.end), index);

    if (edit) {
      edits.set(range.start, edit);
    }
  });

  let value = "";
  let cursor = 0;
  const sortedStarts = [...edits.keys()].sort((a, b) => a - b);

  for (const lineStart of sortedStarts) {
    const edit = edits.get(lineStart) as LineEdit;

    value += state.value.slice(cursor, lineStart) + edit.newPrefix;
    cursor = lineStart + edit.oldPrefixLength;
  }

  value += state.value.slice(cursor);

  const mapPosition = (position: number, keepLineStart: boolean) => {
    let shift = 0;

    for (const lineStart of sortedStarts) {
      const edit = edits.get(lineStart) as LineEdit;

      if (position < lineStart || (keepLineStart && position === lineStart)) {
        break;
      }

      const column = position - lineStart;

      if (column < edit.oldPrefixLength) {
        // 游標原本在被換掉的前綴裡：移到新前綴後面。
        return lineStart + shift + edit.newPrefix.length;
      }

      shift += edit.newPrefix.length - edit.oldPrefixLength;
    }

    return position + shift;
  };

  const hasSelection = state.selectionEnd > state.selectionStart;

  return {
    selectionEnd: mapPosition(state.selectionEnd, false),
    selectionStart: mapPosition(state.selectionStart, hasSelection),
    value,
  };
}

// 選取多行時略過空白行（不產生空的標題或清單項目）；只有一行時照常處理，方便在空行開始輸入。
function getEligibleLineIndexes(state: TextEditState): Set<number> {
  const lines = getSelectedLines(state);

  if (lines.length === 1) {
    return new Set([0]);
  }

  return new Set(
    lines.flatMap((range, index) => (state.value.slice(range.start, range.end).trim() ? [index] : [])),
  );
}

function toggleLinePrefix(
  state: TextEditState,
  options: {
    // 這一行已經有這種前綴時回傳前綴長度，沒有時回傳 null。
    matchPrefix: (line: string) => number | null;
    // 加上前綴前，要先拿掉的其他前綴長度（例如換清單種類、換標題層級）。
    replacePrefix?: (line: string) => number;
    prefixFor: (order: number) => string;
  },
): TextEditState {
  const lines = getSelectedLines(state);
  const eligible = getEligibleLineIndexes(state);
  const eligibleLines = lines.filter((_, index) => eligible.has(index)).map((range) => state.value.slice(range.start, range.end));
  const removeAll = eligibleLines.length > 0 && eligibleLines.every((line) => options.matchPrefix(line) !== null);
  let order = 0;

  return editLines(state, (line, index) => {
    if (!eligible.has(index)) {
      return null;
    }

    if (removeAll) {
      return { newPrefix: "", oldPrefixLength: options.matchPrefix(line) ?? 0 };
    }

    order += 1;

    const existing = options.matchPrefix(line);
    const oldPrefixLength = existing ?? options.replacePrefix?.(line) ?? 0;

    return { newPrefix: options.prefixFor(order), oldPrefixLength };
  });
}

function prefixLength(pattern: RegExp) {
  return (line: string) => line.match(pattern)?.[0].length ?? null;
}

const ANY_HEADING = /^#{1,6} /;
const BULLET = /^[-*+] /;
const NUMBERED = /^\d+\. /;

// 大標（##）／小標（###）：已是同一種標題時拿掉；是其他層級的標題時換成這一種。
export function toggleHeading(state: TextEditState, level: 2 | 3): TextEditState {
  const prefix = `${"#".repeat(level)} `;

  return toggleLinePrefix(state, {
    matchPrefix: (line) => (line.startsWith(prefix) ? prefix.length : null),
    prefixFor: () => prefix,
    replacePrefix: (line) => line.match(ANY_HEADING)?.[0].length ?? 0,
  });
}

export function toggleQuote(state: TextEditState): TextEditState {
  return toggleLinePrefix(state, {
    matchPrefix: prefixLength(/^> ?/),
    prefixFor: () => "> ",
  });
}

export function toggleBulletList(state: TextEditState): TextEditState {
  return toggleLinePrefix(state, {
    matchPrefix: prefixLength(BULLET),
    prefixFor: () => "- ",
    replacePrefix: (line) => line.match(NUMBERED)?.[0].length ?? 0,
  });
}

export function toggleNumberedList(state: TextEditState): TextEditState {
  return toggleLinePrefix(state, {
    // 已經有編號的行也重新編號，讓順序連續。
    matchPrefix: prefixLength(NUMBERED),
    prefixFor: (order) => `${order}. `,
    replacePrefix: (line) => line.match(BULLET)?.[0].length ?? 0,
  });
}

// ---- 區塊：表格、程式碼區塊、Mermaid ----

function countEdgeNewlines(text: string, fromEnd: boolean) {
  let count = 0;

  while (count < 2 && text[fromEnd ? text.length - 1 - count : count] === "\n") {
    count += 1;
  }

  return count;
}

// 把 [from, to) 換成 block，並保證前後各空一行：已經有空行就不再加，不會多出超過一行的空行。
// 前面或後面沒有內容時（文件開頭、結尾）不補換行。selection 是插入後要選取的範圍（相對於 block 開頭）。
function insertBlock(
  state: TextEditState,
  range: { from: number; to: number },
  block: string,
  selection: { end: number; start: number },
): TextEditState {
  const before = state.value.slice(0, range.from);
  const after = state.value.slice(range.to);
  const leading = before ? "\n".repeat(2 - countEdgeNewlines(before, true)) : "";
  const trailing = after ? "\n".repeat(2 - countEdgeNewlines(after, false)) : "";
  const blockStart = before.length + leading.length;

  return {
    selectionEnd: blockStart + selection.end,
    selectionStart: blockStart + selection.start,
    value: before + leading + block + trailing + after,
  };
}

const TABLE_BLOCK = "| 欄位一 | 欄位二 |\n| --- | --- |\n| 內容 | 內容 |\n| 內容 | 內容 |";

// 表格插在游標處；有選取文字時插在選取範圍後面，不刪掉選取的文字。插入後選取第一個表頭，方便改名。
export function insertTable(state: TextEditState): TextEditState {
  const position = state.selectionEnd;

  return insertBlock(state, { from: position, to: position }, TABLE_BLOCK, { end: 5, start: 2 });
}

const MERMAID_SAMPLE_LINE = "A[開始] --> B[結束]";
const MERMAID_BLOCK = `\`\`\`mermaid\nflowchart LR\n  ${MERMAID_SAMPLE_LINE}\n\`\`\``;

// Mermaid 範例插在游標處（有選取時插在後面），並選取範例的節點那一行，方便直接改寫。
export function insertMermaid(state: TextEditState): TextEditState {
  const position = state.selectionEnd;
  const sampleStart = MERMAID_BLOCK.indexOf(MERMAID_SAMPLE_LINE);

  return insertBlock(state, { from: position, to: position }, MERMAID_BLOCK, {
    end: sampleStart + MERMAID_SAMPLE_LINE.length,
    start: sampleStart,
  });
}

// 程式碼區塊：有選取時把選取文字放進區塊；游標放在開頭的 ``` 後面，方便輸入語言名稱。
export function insertCodeBlock(state: TextEditState): TextEditState {
  let to = state.selectionEnd;

  // 選取整行時通常會多選到結尾的換行，把它留在區塊外面。
  if (to > state.selectionStart && state.value[to - 1] === "\n") {
    to -= 1;
  }

  const selected = state.value.slice(state.selectionStart, to);
  const block = `\`\`\`\n${selected}\n\`\`\``;

  return insertBlock(state, { from: state.selectionStart, to }, block, { end: 3, start: 3 });
}

// ---- 快捷鍵 ----

const SHORTCUTS: Record<string, "bold" | "italic" | "link"> = { b: "bold", i: "italic", k: "link" };

// 游標在內容欄位時：Cmd/Ctrl+B 粗體、Cmd/Ctrl+I 斜體、Cmd/Ctrl+K 連結。加了 Shift 或 Option/Alt 的組合與其他按鍵都不攔截。
export function getToolbarShortcut(event: {
  altKey: boolean;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
}): "bold" | "italic" | "link" | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
    return null;
  }

  return SHORTCUTS[event.key.toLowerCase()] ?? null;
}
