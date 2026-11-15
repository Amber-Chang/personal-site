// 功能：把文字編輯結果寫回後台的 Markdown textarea，並保留瀏覽器原生的復原（Cmd/Ctrl+Z）。
// 做法：只把有變動的那一段選起來，用 document.execCommand("insertText") 取代；瀏覽器不支援或結果不符時，
// 改用 setRangeText 寫入並補送 input 事件（這種情況下復原可能無法一步還原）。

import { getTextReplacement, type TextEditState } from "../../lib/markdown/text-edits.ts";

type EditableTextarea = Pick<
  HTMLTextAreaElement,
  "dispatchEvent" | "focus" | "selectionEnd" | "selectionStart" | "setRangeText" | "setSelectionRange" | "value"
>;

type ExecCommand = (command: string, showUi: boolean, value: string) => boolean;

function defaultExecCommand(command: string, showUi: boolean, value: string) {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    return false;
  }

  return document.execCommand(command, showUi, value);
}

export function applyTextareaEdit(
  textarea: EditableTextarea,
  next: TextEditState,
  options?: { execCommand?: ExecCommand },
): void {
  const execCommand = options?.execCommand ?? defaultExecCommand;
  const before = textarea.value;
  const replacement = getTextReplacement(before, next.value);

  textarea.focus();

  if (before !== next.value) {
    textarea.setSelectionRange(replacement.start, replacement.end);

    const inserted = execCommand("insertText", false, replacement.text);

    if (!inserted || textarea.value !== next.value) {
      // 退回方案：直接改值，並通知 React 等監聽者內容變了。
      textarea.value = before;
      textarea.setRangeText(replacement.text, replacement.start, replacement.end, "end");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  textarea.setSelectionRange(next.selectionStart, next.selectionEnd);
}
