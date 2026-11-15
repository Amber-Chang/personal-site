// 功能：程式碼區塊標頭的語言名稱與「複製」按鈕的純邏輯。不碰瀏覽器 API（剪貼簿由呼叫端傳入），方便測試。

export const CODE_COPY_LABELS = { copied: "已複製", failed: "複製失敗", idle: "複製" } as const;

// 「已複製」或「複製失敗」顯示多久後回到「複製」。
export const CODE_COPY_FEEDBACK_MS = 2000;

// 常見語言顯示正式名稱；沒列在這裡的語言照原本寫的名稱顯示。
const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  cs: "C#",
  csharp: "C#",
  css: "CSS",
  diff: "Diff",
  dockerfile: "Dockerfile",
  go: "Go",
  graphql: "GraphQL",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  kotlin: "Kotlin",
  markdown: "Markdown",
  md: "Markdown",
  php: "PHP",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  ruby: "Ruby",
  rs: "Rust",
  rust: "Rust",
  scss: "SCSS",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  swift: "Swift",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  zsh: "Zsh",
};

export function getCodeLanguageLabel(language: string | null): string | null {
  if (!language) {
    return null;
  }

  return LANGUAGE_LABELS[language.toLowerCase()] ?? language;
}

// Markdown 的程式碼區塊結尾一定有一個換行；複製時拿掉這一個，其餘原樣保留。
export function getCodeCopyText(textContent: string | null | undefined): string {
  return (textContent ?? "").replace(/\n$/, "");
}

// 寫入剪貼簿；瀏覽器不支援或拒絕（例如頁面沒有焦點、權限被擋）時回報失敗，不丟出錯誤。
export async function copyCodeText(
  text: string,
  clipboard: { writeText: (text: string) => Promise<void> } | undefined,
): Promise<"copied" | "failed"> {
  if (!clipboard) {
    return "failed";
  }

  try {
    await clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
