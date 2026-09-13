import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
// Keep a running development server from overwriting production build manifests.
export default function config(phase: string): NextConfig {
  return {
    distDir:
      phase === PHASE_DEVELOPMENT_SERVER
        ? (process.env.QD_DEV_DIST_DIR ?? ".next")
        : ".next-production",
  };
}
