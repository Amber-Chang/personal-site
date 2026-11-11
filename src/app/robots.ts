// 功能：/robots.txt，排除後台、登入與 API 路徑，並指向 sitemap。

import type { MetadataRoute } from "next";
import { readSiteUrl } from "@/lib/infra/supabase/env";
import { buildRobots } from "./sitemap-data";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = readSiteUrl();

  return buildRobots({ siteUrl: siteUrl && URL.canParse(siteUrl) ? siteUrl : null });
}
