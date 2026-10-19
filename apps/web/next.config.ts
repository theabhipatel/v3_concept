import path from "node:path";
import type { NextConfig } from "next";

// Repo root (v3/), so the app can import the shared data in v3/content.
const repoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  outputFileTracingRoot: repoRoot,
  // The FastAPI agent is a separate Vercel project, reached through this rewrite.
  // Self-hosted voice detection files: the folder is versioned, so they can be cached for a year.
  async headers() {
    return [{ source: "/vad/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
  async rewrites() {
    const agentUrl = process.env.AGENT_URL ?? "http://localhost:8000";
    return [{ source: "/api/agent/:path*", destination: `${agentUrl}/api/agent/:path*` }];
  },
  turbopack: {
    root: repoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
