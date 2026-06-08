import type { ProjectSummary } from "../../lib/content/types.ts";

type ProjectsPageDataService = {
  listPublicProjects: () => Promise<ProjectSummary[]>;
};

export async function loadProjectsPageData(input: {
  service: Pick<ProjectsPageDataService, "listPublicProjects">;
}) {
  return {
    projects: await input.service.listPublicProjects(),
  };
}
