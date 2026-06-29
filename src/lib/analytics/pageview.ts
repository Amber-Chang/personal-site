export type PageViewProperties = {
  content_slug?: string;
  content_title?: string;
  content_type: string;
  published_at?: string;
  section: "public";
  source_template: string;
  tags?: string[];
};

export function createPageViewProperties(input: {
  contentSlug?: string;
  contentTitle?: string;
  contentType: string;
  publishedAt?: string;
  sourceTemplate: string;
  tags?: string[];
}): PageViewProperties {
  return {
    ...(input.contentSlug ? { content_slug: input.contentSlug } : {}),
    ...(input.contentTitle ? { content_title: input.contentTitle } : {}),
    content_type: input.contentType,
    ...(input.publishedAt ? { published_at: input.publishedAt } : {}),
    section: "public",
    source_template: input.sourceTemplate,
    ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {}),
  };
}
