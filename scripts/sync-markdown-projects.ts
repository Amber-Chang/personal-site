import fs from "node:fs";
import path from "node:path";

function loadDotenvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

async function main() {
  loadDotenvFile(path.join(process.cwd(), ".env.local"));

  const [{ createBlogContentService }, { createAdminContentRepositories }, { loadMarkdownProjectInputs, syncMarkdownProjects }] =
    await Promise.all([
      import("../src/lib/content/service.ts"),
      import("../src/lib/infra/repositories/factory.ts"),
      import("../src/lib/content/project-migration.ts"),
    ]);

  const service = createBlogContentService(createAdminContentRepositories());
  const projects = await loadMarkdownProjectInputs();
  const result = await syncMarkdownProjects({
    projects,
    service,
  });

  console.log(
    `Project sync complete. Created: ${result.created.length}. Updated: ${result.updated.length}. Skipped: ${result.skipped.length}.`,
  );

  if (result.created.length > 0) {
    console.log(`Created slugs: ${result.created.join(", ")}`);
  }

  if (result.updated.length > 0) {
    console.log(`Updated slugs: ${result.updated.join(", ")}`);
  }

  if (result.skipped.length > 0) {
    console.log(`Skipped slugs: ${result.skipped.join(", ")}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
