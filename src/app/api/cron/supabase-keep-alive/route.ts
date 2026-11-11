import { createSupabaseKeepAliveHandler } from "@/lib/infra/keep-alive/supabase-keep-alive.ts";
import { createPublicContentRepositories } from "@/lib/infra/repositories/factory.ts";

export const dynamic = "force-dynamic";

// Query Supabase directly on purpose: the public content service falls back to Markdown,
// which would report success without generating any database activity.
const handleSupabaseKeepAlive = createSupabaseKeepAliveHandler({
  listPublishedPosts: () => createPublicContentRepositories().posts.listPublishedPosts(),
  readCronSecret: () => process.env.CRON_SECRET,
});

export const GET = handleSupabaseKeepAlive;
export const POST = handleSupabaseKeepAlive;
