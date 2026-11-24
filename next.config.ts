import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const repositoryRoot = existsSync(path.resolve(appRoot, "../api")) ? path.resolve(appRoot, "../..") : appRoot;

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  outputFileTracingRoot: repositoryRoot,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.API_BASE_URL ?? "http://localhost:4000"}/api/:path*` }];
  },
};

export default nextConfig;
