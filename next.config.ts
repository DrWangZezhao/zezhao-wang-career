import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "zezhao-wang-career";
const basePath = githubPages ? `/${repository}` : "";

const nextConfig: NextConfig = {
  output: githubPages ? "export" : undefined,
  basePath,
  assetPrefix: basePath,
  trailingSlash: githubPages,
  images: { unoptimized: true },
};

export default nextConfig;
