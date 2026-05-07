import path from "path";
import type { NextConfig } from "next";

/**
 * Pins file tracing to this app so Next doesn't treat `package-lock.json` higher
 * in the filesystem (e.g. under `%USERPROFILE%`) as the workspace root.
 *
 * See: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
 */
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
