import { mapPublicPostSummary, mapPublicPostTeaser, type PublicPostSummary } from "../../lib/content/public-post.ts";
import type { BlogPostRecord, ProjectSummary } from "../../lib/content/types.ts";

export type PublicBlogPostSummary = PublicPostSummary;

export type PublicBlogPost = ReturnType<typeof mapPublicPostTeaser> & {
  content: string;
  description: string;
  relatedProject: {
    slug: string;
    summary: string;
    title: string;
  } | null;
};

type PublicBlogDataService = {
  getPublicProjectById: (id: string) => Promise<ProjectSummary | null>;
  getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
  listPublicPosts: () => Promise<BlogPostRecord[]>;
};

export function mapPublicBlogPostSummary(post: BlogPostRecord): PublicBlogPostSummary {
  return mapPublicPostSummary(post);
}

export function mapPublicBlogPost(post: BlogPostRecord): PublicBlogPost {
  return {
    ...mapPublicPostTeaser(post),
    content: post.contentMarkdown,
    relatedProject: null,
  };
}

async function getRelatedProject(input: {
  post: BlogPostRecord;
  service: Pick<PublicBlogDataService, "getPublicProjectById">;
}) {
  if (!input.post.relatedProjectId) {
    return null;
  }

  const project = await input.service.getPublicProjectById(input.post.relatedProjectId);

  return project
    ? {
        slug: project.slug,
        summary: project.summary,
        title: project.title,
      }
    : null;
}

export async function loadBlogIndexPageData(input: {
  service: Pick<PublicBlogDataService, "listPublicPosts">;
}) {
  const posts = await input.service.listPublicPosts();

  return {
    posts: posts.map(mapPublicBlogPostSummary),
  };
}

export async function loadBlogPostPageData(input: {
  service: Pick<PublicBlogDataService, "getPublicProjectById" | "getPublicPostBySlug">;
  slug: string;
}) {
  const post = await input.service.getPublicPostBySlug(input.slug);

  if (!post) {
    return null;
  }

  return {
    ...mapPublicBlogPost(post),
    relatedProject: await getRelatedProject({
      post,
      service: input.service,
    }),
  };
}
