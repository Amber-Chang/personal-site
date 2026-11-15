import assert from "node:assert/strict";
import test from "node:test";

type EditState = { selectionEnd: number; selectionStart: number; value: string };
type Action = (state: EditState) => EditState;

type ToolbarActionsModule = {
  insertCodeBlock: Action;
  insertLink: Action;
  insertMermaid: Action;
  insertTable: Action;
  toggleBulletList: Action;
  toggleHeading: (state: EditState, level: 2 | 3) => EditState;
  toggleNumberedList: Action;
  toggleQuote: Action;
  wrapBold: Action;
  wrapItalic: Action;
};

async function loadModule(): Promise<ToolbarActionsModule> {
  const loadedModule = await import("./toolbar-actions.ts").catch(() => null);

  assert.ok(loadedModule, "expected toolbar actions module to exist at ./toolbar-actions.ts");

  return loadedModule as ToolbarActionsModule;
}

// 測試用標記：« » 是選取範圍的頭尾，‸ 是沒有選取時的游標。
function parse(marked: string): EditState {
  const caret = marked.indexOf("‸");

  if (caret >= 0) {
    return { selectionEnd: caret, selectionStart: caret, value: marked.replace("‸", "") };
  }

  const start = marked.indexOf("«");
  const end = marked.indexOf("»") - 1;

  return { selectionEnd: end, selectionStart: start, value: marked.replace("«", "").replace("»", "") };
}

function format(state: EditState): string {
  const { selectionEnd, selectionStart, value } = state;

  if (selectionStart === selectionEnd) {
    return `${value.slice(0, selectionStart)}‸${value.slice(selectionStart)}`;
  }

  return `${value.slice(0, selectionStart)}«${value.slice(selectionStart, selectionEnd)}»${value.slice(selectionEnd)}`;
}

function check(action: Action, cases: Array<[string, string]>) {
  for (const [input, expected] of cases) {
    assert.equal(format(action(parse(input))), expected, `input: ${JSON.stringify(input)}`);
  }
}

const TABLE = "| «欄位一» | 欄位二 |\n| --- | --- |\n| 內容 | 內容 |\n| 內容 | 內容 |";
const MERMAID = "```mermaid\nflowchart LR\n  «A[開始] --> B[結束]»\n```";

test("粗體 wraps the selection in ** or inserts a selected placeholder", async () => {
  const { wrapBold } = await loadModule();

  check(wrapBold, [
    ["ab«cd»ef", "ab**«cd»**ef"],
    ["ab‸ef", "ab**«粗體文字»**ef"],
    ["«第一行\n第二行»", "**«第一行\n第二行»**"],
    ["‸開頭", "**«粗體文字»**開頭"],
    ["結尾‸", "結尾**«粗體文字»**"],
    // 選取範圍頭尾的空白留在外面，避免變成無效的 ** 文字 **。
    ["a« b »c", "a **«b»** c"],
  ]);
});

test("斜體 wraps the selection in * or inserts a selected placeholder", async () => {
  const { wrapItalic } = await loadModule();

  check(wrapItalic, [
    ["ab«cd»ef", "ab*«cd»*ef"],
    ["ab‸ef", "ab*«斜體文字»*ef"],
    ["«第一行\n第二行»", "*«第一行\n第二行»*"],
    ["‸開頭", "*«斜體文字»*開頭"],
    ["結尾‸", "結尾*«斜體文字»*"],
  ]);
});

test("大標 adds ## to the current or selected lines, removes it, or switches from another heading", async () => {
  const { toggleHeading } = await loadModule();

  check((state) => toggleHeading(state, 2), [
    ["前文\n標‸題\n後文", "前文\n## 標‸題\n後文"],
    ["## 標‸題", "標‸題"],
    ["### 標‸題", "## 標‸題"],
    ["# 標‸題", "## 標‸題"],
    ["a«bc»d", "## a«bc»d"],
    ["«一\n二»\n三", "«## 一\n## 二»\n三"],
    ["«一\n\n二»", "«## 一\n\n## 二»"],
    ["«## 一\n## 二»", "«一\n二»"],
    ["«## 一\n二»", "«## 一\n## 二»"],
    ["«一\n»二", "«## 一\n»二"],
    ["‸開頭", "## ‸開頭"],
    ["結尾‸", "## 結尾‸"],
    ["‸", "## ‸"],
  ]);
});

test("小標 adds ### the same way and switches from ##", async () => {
  const { toggleHeading } = await loadModule();

  check((state) => toggleHeading(state, 3), [
    ["標‸題", "### 標‸題"],
    ["## 標‸題", "### 標‸題"],
    ["### 標‸題", "標‸題"],
    ["«一\n二»", "«### 一\n### 二»"],
    ["‸開頭", "### ‸開頭"],
    ["結尾‸", "### 結尾‸"],
  ]);
});

test("連結 outputs [text](url) and selects url so it can be replaced right away", async () => {
  const { insertLink } = await loadModule();

  check(insertLink, [
    ["看«這裡»吧", "看[這裡](«url»)吧"],
    ["看‸吧", "看[連結文字](«url»)吧"],
    ["«第一行\n第二行»", "[第一行\n第二行](«url»)"],
    ["‸開頭", "[連結文字](«url»)開頭"],
    ["結尾‸", "結尾[連結文字](«url»)"],
    ["a« 這裡 »b", "a [這裡](«url») b"],
  ]);
});

test("引言 prefixes every selected line with > and removes it when all lines have it", async () => {
  const { toggleQuote } = await loadModule();

  check(toggleQuote, [
    ["引‸言", "> 引‸言"],
    ["a«b»c", "> a«b»c"],
    ["«一\n二»", "«> 一\n> 二»"],
    ["«> 一\n> 二»", "«一\n二»"],
    ["«> 一\n二»", "«> 一\n> 二»"],
    ["«一\n\n二»", "«> 一\n\n> 二»"],
    ["‸開頭", "> ‸開頭"],
    ["結尾‸", "> 結尾‸"],
  ]);
});

test("項目清單 prefixes lines with - , removes it, and converts a numbered list", async () => {
  const { toggleBulletList } = await loadModule();

  check(toggleBulletList, [
    ["項‸目", "- 項‸目"],
    ["a«b»c", "- a«b»c"],
    ["«一\n二»", "«- 一\n- 二»"],
    ["«- 一\n- 二»", "«一\n二»"],
    ["«1. 一\n2. 二»", "«- 一\n- 二»"],
    ["«一\n\n二»", "«- 一\n\n- 二»"],
    ["‸開頭", "- ‸開頭"],
    ["結尾‸", "- 結尾‸"],
  ]);
});

test("編號清單 numbers each selected line, removes the numbers, and converts a bullet list", async () => {
  const { toggleNumberedList } = await loadModule();

  check(toggleNumberedList, [
    ["項‸目", "1. 項‸目"],
    ["a«b»c", "1. a«b»c"],
    ["«一\n二\n三»", "«1. 一\n2. 二\n3. 三»"],
    ["«1. 一\n2. 二»", "«一\n二»"],
    ["«- 一\n- 二»", "«1. 一\n2. 二»"],
    ["«一\n\n二»", "«1. 一\n\n2. 二»"],
    ["‸開頭", "1. ‸開頭"],
    ["結尾‸", "1. 結尾‸"],
  ]);
});

test("表格 inserts a 2-column sample table on its own lines with exactly one blank line around it", async () => {
  const { insertTable } = await loadModule();

  check(insertTable, [
    ["‸", TABLE],
    ["段落‸", `段落\n\n${TABLE}`],
    ["‸段落", `${TABLE}\n\n段落`],
    ["前‸後", `前\n\n${TABLE}\n\n後`],
    ["前\n‸後", `前\n\n${TABLE}\n\n後`],
    ["前\n\n‸\n\n後", `前\n\n${TABLE}\n\n後`],
    // 有選取文字時插在選取範圍後面，不刪掉選取的文字。
    ["a«b»c", `ab\n\n${TABLE}\n\nc`],
    ["«一\n二»", `一\n二\n\n${TABLE}`],
  ]);
});

test("程式碼區塊 inserts an empty fence with the caret after the opening ``` or wraps the selection", async () => {
  const { insertCodeBlock } = await loadModule();

  check(insertCodeBlock, [
    ["‸", "```‸\n\n```"],
    ["段落‸", "段落\n\n```‸\n\n```"],
    ["‸段落", "```‸\n\n```\n\n段落"],
    ["前‸後", "前\n\n```‸\n\n```\n\n後"],
    ["«const a = 1;»", "```‸\nconst a = 1;\n```"],
    ["前\n«a\nb\n»後", "前\n\n```‸\na\nb\n```\n\n後"],
    ["說明 «npm test» 結束", "說明 \n\n```‸\nnpm test\n```\n\n 結束"],
  ]);
});

test("Mermaid 圖表 inserts a minimal valid flowchart in a mermaid fence on its own lines", async () => {
  const { insertMermaid } = await loadModule();

  check(insertMermaid, [
    ["‸", MERMAID],
    ["段落‸", `段落\n\n${MERMAID}`],
    ["‸段落", `${MERMAID}\n\n段落`],
    ["前\n\n‸", `前\n\n${MERMAID}`],
    ["a«b»c", `ab\n\n${MERMAID}\n\nc`],
  ]);
});

test("only Cmd/Ctrl+B, Cmd/Ctrl+I and Cmd/Ctrl+K are toolbar shortcuts", async () => {
  const { getToolbarShortcut } = (await loadModule()) as unknown as {
    getToolbarShortcut: (event: { altKey: boolean; ctrlKey: boolean; key: string; metaKey: boolean; shiftKey: boolean }) => string | null;
  };
  const key = (value: string, modifiers: Partial<{ altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }> = {}) =>
    getToolbarShortcut({ altKey: false, ctrlKey: false, key: value, metaKey: false, shiftKey: false, ...modifiers });

  assert.equal(key("b", { metaKey: true }), "bold");
  assert.equal(key("B", { ctrlKey: true }), "bold");
  assert.equal(key("i", { metaKey: true }), "italic");
  assert.equal(key("k", { ctrlKey: true }), "link");
  // 其他快捷鍵（復原、全選、儲存、加了 Shift 或 Option 的組合）一律不攔截。
  assert.equal(key("z", { metaKey: true }), null);
  assert.equal(key("a", { metaKey: true }), null);
  assert.equal(key("s", { ctrlKey: true }), null);
  assert.equal(key("b", { metaKey: true, shiftKey: true }), null);
  assert.equal(key("k", { altKey: true, metaKey: true }), null);
  assert.equal(key("b"), null);
});
