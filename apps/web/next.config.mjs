/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode helps surface potential issues in production-like builds
  reactStrictMode: true,

  // Produce a standalone server output (good for Netlify/Vercel and Docker)
  // Only enable on CI/CD or when not on Windows to avoid symlink permission issues
  output: process.env.CI || process.platform !== 'win32' ? 'standalone' : undefined,

  // Include Prisma engine files in output (moved to top-level for Next.js 16+)
  outputFileTracingIncludes: {
    '/*': [
      '../../packages/db/prisma/generated/client/**/*',
      '../../packages/db/node_modules/.prisma/client/**/*',
      '../../packages/db/node_modules/@prisma/client/**/*',
    ],
  },

  experimental: {
    // Enable Server Actions in production
    serverActions: {},
  },

  typescript: {
    // Permit production builds even if type errors exist
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
