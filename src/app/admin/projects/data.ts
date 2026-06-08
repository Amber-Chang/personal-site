import type { ProjectRecord } from "../../../lib/content/types.ts";

type AdminProjectsDataService = {
  getAdminProjectById: (id: string) => Promise<ProjectRecord | null>;
  listAdminProjects: () => Promise<ProjectRecord[]>;
};

export async function loadAdminProjectsPageData(input: {
  service: Pick<AdminProjectsDataService, "listAdminProjects">;
}) {
  return {
    projects: await input.service.listAdminProjects(),
  };
}

export async function loadAdminProjectEditPageData(input: {
  id: string;
  service: Pick<AdminProjectsDataService, "getAdminProjectById">;
}) {
  const project = await input.service.getAdminProjectById(input.id);

  if (!project) {
    return null;
  }

  return {
    project,
  };
}
