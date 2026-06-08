#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const ackMode = process.argv.includes("--ack");

const docRules = [
  {
    id: "deployment",
    label: "deployment / auth / admin",
    triggers: [
      /^src\/app\/admin\//,
      /^src\/lib\/auth\//,
      /^src\/lib\/infra\//,
      /^supabase\//,
      /^README\.md$/,
      /^next\.config\.ts$/,
      /^package\.json$/,
    ],
    reviewDocs: ["NOW.md", "docs/deployment-security-readiness.md"],
  },
  {
    id: "blog-admin",
    label: "blog admin / content flow",
    triggers: [
      /^src\/app\/admin\/posts\//,
      /^src\/lib\/content\//,
      /^content\/posts\//,
      /^scripts\/import-markdown-posts\.ts$/,
    ],
    reviewDocs: ["NOW.md", "docs/blog-admin-implementation-spec.md"],
  },
  {
    id: "architecture",
    label: "architecture / workflow / governance",
    triggers: [
      /^AGENTS\.md$/,
      /^FOUNDATION\.md$/,
      /^docs\/development-workflow\.md$/,
      /^docs\/system-architecture-principles\.md$/,
      /^src\/lib\//,
    ],
    reviewDocs: ["NOW.md", "docs/development-workflow.md"],
  },
];

function getChangedFiles() {
  const output = execFileSync("git", ["status", "--short"], {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trimEnd();

  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .map((file) => {
      const renameParts = file.split(" -> ");
      return renameParts[renameParts.length - 1];
    });
}

function matchesRule(file, rule) {
  return rule.triggers.some((pattern) => pattern.test(file));
}

function formatList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

const changedFiles = getChangedFiles();

if (changedFiles.length === 0) {
  console.log("沒有偵測到工作區變更，暫時不需要做文件同步檢查。");
  process.exit(0);
}

const matchedRules = docRules
  .map((rule) => {
    const triggeredBy = changedFiles.filter((file) => matchesRule(file, rule));
    return {
      ...rule,
      triggeredBy,
      touchedDocs: rule.reviewDocs.filter((doc) => changedFiles.includes(doc)),
    };
  })
  .filter((rule) => rule.triggeredBy.length > 0);

if (matchedRules.length === 0) {
  console.log("這次變更沒有命中高風險文件同步規則。");
  console.log("仍建議收尾前快速檢查 `NOW.md` 是否需要更新。");
  process.exit(0);
}

const missingReview = matchedRules.filter((rule) => rule.touchedDocs.length === 0);

console.log("文件同步檢查結果");
console.log("");
console.log("本次變更檔案：");
console.log(formatList(changedFiles));
console.log("");

for (const rule of matchedRules) {
  console.log(`規則：${rule.label}`);
  console.log("觸發來源：");
  console.log(formatList(rule.triggeredBy));
  console.log("建議檢查文件：");
  console.log(formatList(rule.reviewDocs));

  if (rule.touchedDocs.length > 0) {
    console.log("目前已同步到：");
    console.log(formatList(rule.touchedDocs));
  } else {
    console.log("目前尚未看到對應文件更新。");
  }

  console.log("");
}

if (missingReview.length === 0) {
  console.log("文件同步檢查通過：這次高風險變更已有對應文件一起更新。");
  process.exit(0);
}

console.log("文件同步檢查提醒：有高風險變更，但還沒看到對應文件更新。");
console.log("如果你已經人工確認這次不需要更新文件，可用 `--ack` 再跑一次。");

if (ackMode) {
  console.log("已收到 `--ack`，本次以人工確認為準。");
  process.exit(0);
}

process.exit(1);
