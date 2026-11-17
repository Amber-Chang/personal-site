import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SPEC-004：案例列表併入首頁（案例分頁）。舊的 /projects 永久轉址（308）到 /；/projects/[slug] 內頁不變。
  async redirects() {
    return [{ destination: "/", permanent: true, source: "/projects" }];
  },
};

export default nextConfig;
