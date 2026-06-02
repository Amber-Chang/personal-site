import { mapPublicBlogPostSummary } from "./blog/data.ts";
import type { BlogPostRecord } from "../lib/content/types.ts";

type HomeWritingDataService = {
  listPublicPosts: () => Promise<BlogPostRecord[]>;
};

export async function loadHomeWritingData(input: {
  limit?: number;
  service: HomeWritingDataService;
}) {
  const limit = input.limit ?? 3;
  const posts = await input.service.listPublicPosts();

  return {
    posts: posts.slice(0, limit).map(mapPublicBlogPostSummary),
  };
}
