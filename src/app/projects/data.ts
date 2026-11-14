import { mapPublicProjectCard } from "../../lib/content/public-project.ts";
import type { ProjectSummary } from "../../lib/content/types.ts";

type ProjectsPageDataService = {
  listPublicProjects: () => Promise<ProjectSummary[]>;
};

export async function loadProjectsPageData(input: {
  service: Pick<ProjectsPageDataService, "listPublicProjects">;
}) {
  const projects = await input.service.listPublicProjects();

  return {
    projects: projects.map((project) => mapPublicProjectCard(project)),
  };
}
