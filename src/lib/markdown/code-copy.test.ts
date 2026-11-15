import assert from "node:assert/strict";
import test from "node:test";

type CodeCopyModule = {
  CODE_COPY_FEEDBACK_MS: number;
  CODE_COPY_LABELS: { copied: string; failed: string; idle: string };
  copyCodeText: (text: string, clipboard: { writeText: (text: string) => Promise<void> } | undefined) => Promise<"copied" | "failed">;
  getCodeCopyText: (textContent: string | null | undefined) => string;
  getCodeLanguageLabel: (language: string | null) => string | null;
};

async function loadModule(): Promise<CodeCopyModule> {
  const loadedModule = await import("./code-copy.ts").catch(() => null);

  assert.ok(loadedModule, "expected code copy module to exist at ./code-copy.ts");

  return loadedModule as CodeCopyModule;
}

test("common languages show their proper names; others show the declared name as written", async () => {
  const { getCodeLanguageLabel } = await loadModule();

  assert.equal(getCodeLanguageLabel("ts"), "TypeScript");
  assert.equal(getCodeLanguageLabel("typescript"), "TypeScript");
  assert.equal(getCodeLanguageLabel("tsx"), "TSX");
  assert.equal(getCodeLanguageLabel("js"), "JavaScript");
  assert.equal(getCodeLanguageLabel("json"), "JSON");
  assert.equal(getCodeLanguageLabel("html"), "HTML");
  assert.equal(getCodeLanguageLabel("css"), "CSS");
  assert.equal(getCodeLanguageLabel("bash"), "Bash");
  assert.equal(getCodeLanguageLabel("sh"), "Shell");
  assert.equal(getCodeLanguageLabel("sql"), "SQL");
  assert.equal(getCodeLanguageLabel("py"), "Python");
  assert.equal(getCodeLanguageLabel("yml"), "YAML");
  assert.equal(getCodeLanguageLabel("md"), "Markdown");
  assert.equal(getCodeLanguageLabel("diff"), "Diff");
  assert.equal(getCodeLanguageLabel("TS"), "TypeScript");
  assert.equal(getCodeLanguageLabel("klingon"), "klingon");
  assert.equal(getCodeLanguageLabel("Elixir"), "Elixir");
  assert.equal(getCodeLanguageLabel(null), null);
  assert.equal(getCodeLanguageLabel(""), null);
});

test("the copied text is the source without the trailing newline Markdown adds", async () => {
  const { getCodeCopyText } = await loadModule();

  assert.equal(getCodeCopyText("const a = 1;\n"), "const a = 1;");
  assert.equal(getCodeCopyText("a\n\nb\n"), "a\n\nb");
  assert.equal(getCodeCopyText("  indented\n\n"), "  indented\n");
  assert.equal(getCodeCopyText("no newline"), "no newline");
  assert.equal(getCodeCopyText(null), "");
});

test("copyCodeText writes to the clipboard and reports failures instead of throwing", async () => {
  const { copyCodeText } = await loadModule();
  const written: string[] = [];

  assert.equal(await copyCodeText("x", { writeText: async (text) => void written.push(text) }), "copied");
  assert.deepEqual(written, ["x"]);
  assert.equal(
    await copyCodeText("x", {
      writeText: async () => {
        throw new DOMException("Document is not focused.", "NotAllowedError");
      },
    }),
    "failed",
  );
  assert.equal(await copyCodeText("x", undefined), "failed");
});

test("labels and feedback duration match the agreed copy", async () => {
  const { CODE_COPY_FEEDBACK_MS, CODE_COPY_LABELS } = await loadModule();

  assert.deepEqual(CODE_COPY_LABELS, { copied: "已複製", failed: "複製失敗", idle: "複製" });
  assert.equal(CODE_COPY_FEEDBACK_MS, 2000);
});
