import { createBlogContentService } from "../../lib/content/service.ts";
import { createPublicContentRepositories } from "../../lib/infra/repositories/factory.ts";

export function getPublicBlogContentService() {
  return createBlogContentService(createPublicContentRepositories());
}
