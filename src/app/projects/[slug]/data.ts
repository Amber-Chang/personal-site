import { mapPublicPostTeaser } from "../../../lib/content/public-post.ts";
import type { BlogPostRecord, PublicProjectRecord } from "../../../lib/content/types.ts";

type PublicProjectDataService = {
  getPublicProjectBySlug: (slug: string) => Promise<PublicProjectRecord | null>;
  listPostsByProjectId: (projectId: string) => Promise<BlogPostRecord[]>;
};

type RelatedPostSummary = {
  date: string;
  description: string;
  slug: string;
  title: string;
};

function mapRelatedPost(post: BlogPostRecord): RelatedPostSummary {
  const publicPost = mapPublicPostTeaser(post);

  return {
    date: publicPost.date,
    description: publicPost.description,
    slug: publicPost.slug,
    title: publicPost.title,
  };
}

export async function loadProjectPageData(input: {
  service: PublicProjectDataService;
  slug: string;
}) {
  const project = await input.service.getPublicProjectBySlug(input.slug);

  if (!project) {
    return null;
  }

  const relatedPosts = project.id
    ? await input.service.listPostsByProjectId(project.id)
    : [];

  return {
    content: project.content,
    outcomes: project.outcomes,
    period: project.period,
    relatedPosts: relatedPosts.map(mapRelatedPost),
    role: project.role,
    slug: project.slug,
    summary: project.summary,
    tags: project.tags,
    title: project.title,
  };
}
