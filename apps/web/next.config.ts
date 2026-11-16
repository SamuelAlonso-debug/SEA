import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // `next dev` generaría apps/web/AGENTS.md: la documentación vive en la wiki.
  agentRules: false,
};

export default nextConfig;
