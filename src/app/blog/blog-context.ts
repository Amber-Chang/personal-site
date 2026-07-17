import { createBlogContentService } from "../../lib/content/service.ts";
import { createPublicContentRepositories } from "../../lib/infra/repositories/factory.ts";
import { createMarkdownPublicContentRepositories } from "../../lib/infra/repositories/markdown-public-repositories.ts";
import { MissingEnvironmentVariableError } from "../../lib/infra/supabase/env.ts";

function isMissingPublicContentEnvError(error: unknown) {
  return error instanceof MissingEnvironmentVariableError;
}

export function createPublicBlogContentService<
  TRepositories extends Parameters<typeof createBlogContentService>[0],
  TService = ReturnType<typeof createBlogContentService>,
>(input?: {
  createBlogContentService?: (repositories: TRepositories) => TService;
  createFallbackPublicContentRepositories?: () => TRepositories;
  createPublicContentRepositories?: () => TRepositories;
  isMissingPublicContentEnvError?: (error: unknown) => boolean;
}) {
  const createService = input?.createBlogContentService ?? (createBlogContentService as (repositories: TRepositories) => TService);
  const createPrimaryRepositories = input?.createPublicContentRepositories ?? (createPublicContentRepositories as () => TRepositories);
  const createFallbackRepositories =
    input?.createFallbackPublicContentRepositories ?? (createMarkdownPublicContentRepositories as () => TRepositories);
  const isMissingEnvError = input?.isMissingPublicContentEnvError ?? isMissingPublicContentEnvError;

  try {
    return createService(createPrimaryRepositories());
  } catch (error) {
    if (!isMissingEnvError(error)) {
      throw error;
    }

    return createService(createFallbackRepositories());
  }
}

export function getPublicBlogContentService() {
  return createPublicBlogContentService();
}
