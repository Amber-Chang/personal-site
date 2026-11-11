import { createHash, timingSafeEqual } from "node:crypto";

// Supabase Free plan pauses projects without enough database activity over 7 days.
// A scheduled job calls this handler a few times a day so the project keeps receiving real queries.

export type SupabaseKeepAliveDependencies = {
  listPublishedPosts: () => Promise<unknown[]>;
  logError?: (message: string, error?: unknown) => void;
  readCronSecret: () => string | null | undefined;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return Response.json(body, {
    headers: { "cache-control": "no-store" },
    status,
  });
}

function hashForComparison(value: string) {
  return createHash("sha256").update(value).digest();
}

function hasValidBearerSecret(authorizationHeader: string | null, expectedSecret: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }

  const providedSecret = authorizationHeader.slice("Bearer ".length);

  return timingSafeEqual(hashForComparison(providedSecret), hashForComparison(expectedSecret));
}

export function createSupabaseKeepAliveHandler(dependencies: SupabaseKeepAliveDependencies) {
  const logError = dependencies.logError ?? ((message: string, error?: unknown) => console.error(message, error));

  return async function handleSupabaseKeepAlive(request: Request): Promise<Response> {
    const cronSecret = dependencies.readCronSecret()?.trim();

    if (!cronSecret) {
      logError("[supabase-keep-alive] CRON_SECRET is not configured; refusing to run.");

      return jsonResponse({ error: "cron_secret_not_configured", ok: false }, 500);
    }

    if (!hasValidBearerSecret(request.headers.get("authorization"), cronSecret)) {
      return jsonResponse({ error: "unauthorized", ok: false }, 401);
    }

    try {
      const publishedPosts = await dependencies.listPublishedPosts();

      return jsonResponse(
        {
          checkedAt: new Date().toISOString(),
          ok: true,
          publishedPostCount: publishedPosts.length,
        },
        200,
      );
    } catch (error) {
      logError("[supabase-keep-alive] Supabase query failed.", error);

      return jsonResponse({ error: "supabase_query_failed", ok: false }, 500);
    }
  };
}
