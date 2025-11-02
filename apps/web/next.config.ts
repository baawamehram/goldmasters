import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // needed for Netlify + modern Next.js
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
