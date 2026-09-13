import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker production image copies only .next/standalone — see Dockerfile.
  output: "standalone",
  // Prisma's query engine is a native binary loaded dynamically at runtime,
  // not a static import — Next's output tracing can miss it. Force-include
  // it for every route that might touch the DB (i.e. all of them, since the
  // API lives in this app's Route Handlers). Also explicitly copied in the
  // Dockerfile's runtime stage as a belt-and-suspenders measure.
  outputFileTracingIncludes: {
    "/*": ["node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;
