import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this package so the build does not go
  // looking for a lockfile in a parent directory.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
