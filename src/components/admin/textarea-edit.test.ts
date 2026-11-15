import assert from "node:assert/strict";
import test from "node:test";

type FakeTextarea = {
  dispatched: string[];
  dispatchEvent: (event: Event) => boolean;
  focus: () => void;
  focused: boolean;
  selectionEnd: number;
  selectionStart: number;
  setRangeText: (text: string, start: number, end: number, mode: string) => void;
  setSelectionRange: (start: number, end: number) => void;
  value: string;
};

type TextareaEditModule = {
  applyTextareaEdit: (
    textarea: FakeTextarea,
    next: { selectionEnd: number; selectionStart: number; value: string },
    options?: { execCommand?: (command: string, showUi: boolean, value: string) => boolean },
  ) => void;
};

async function loadModule(): Promise<TextareaEditModule> {
  const loadedModule = await import("./textarea-edit.ts").catch(() => null);

  assert.ok(loadedModule, "expected textarea edit helper to exist at ./textarea-edit.ts");

  return loadedModule as unknown as TextareaEditModule;
}

function createTextarea(value: string): FakeTextarea {
  const textarea: FakeTextarea = {
    dispatched: [],
    dispatchEvent(event) {
      textarea.dispatched.push(event.type);
      return true;
    },
    focus() {
      textarea.focused = true;
    },
    focused: false,
    selectionEnd: 0,
    selectionStart: 0,
    setRangeText(text, start, end) {
      textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
    },
    setSelectionRange(start, end) {
      textarea.selectionStart = start;
      textarea.selectionEnd = end;
    },
    value,
  };

  return textarea;
}

test("applyTextareaEdit replaces only the changed range through insertText so native undo keeps working", async () => {
  const { applyTextareaEdit } = await loadModule();
  const textarea = createTextarea("前文後文");
  const commands: Array<[string, string, number, number]> = [];

  applyTextareaEdit(
    textarea,
    { selectionEnd: 9, selectionStart: 9, value: "前文![a](u)後文" },
    {
      execCommand: (command, _showUi, text) => {
        commands.push([command, text, textarea.selectionStart, textarea.selectionEnd]);
        textarea.value = textarea.value.slice(0, textarea.selectionStart) + text + textarea.value.slice(textarea.selectionEnd);
        return true;
      },
    },
  );

  assert.deepEqual(commands, [["insertText", "![a](u)", 2, 2]]);
  assert.equal(textarea.value, "前文![a](u)後文");
  assert.equal(textarea.focused, true);
  assert.deepEqual([textarea.selectionStart, textarea.selectionEnd], [9, 9]);
  // insertText 自己會觸發 input 事件，不重複送。
  assert.deepEqual(textarea.dispatched, []);
});

test("applyTextareaEdit falls back to setRangeText and fires an input event when insertText is unavailable", async () => {
  const { applyTextareaEdit } = await loadModule();
  const textarea = createTextarea("段落");

  applyTextareaEdit(textarea, { selectionEnd: 11, selectionStart: 11, value: "段落\n\n![a](u)" }, { execCommand: () => false });

  assert.equal(textarea.value, "段落\n\n![a](u)");
  assert.deepEqual([textarea.selectionStart, textarea.selectionEnd], [11, 11]);
  assert.deepEqual(textarea.dispatched, ["input"]);
});

test("applyTextareaEdit falls back when insertText reports success but leaves a different value", async () => {
  const { applyTextareaEdit } = await loadModule();
  const textarea = createTextarea("abc");

  applyTextareaEdit(textarea, { selectionEnd: 4, selectionStart: 1, value: "a**b**c" }, { execCommand: () => true });

  assert.equal(textarea.value, "a**b**c");
  assert.deepEqual([textarea.selectionStart, textarea.selectionEnd], [4, 1].sort((a, b) => a - b));
  assert.deepEqual(textarea.dispatched, ["input"]);
});
