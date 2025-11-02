import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: '../../public/.next',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
