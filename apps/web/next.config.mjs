/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode helps surface potential issues in production-like builds
  reactStrictMode: true,

  // Produce a standalone server output (good for Netlify/Vercel and Docker)
  // Only enable on CI/CD or when not on Windows to avoid symlink permission issues
  output: process.env.CI || process.platform !== 'win32' ? 'standalone' : undefined,

  // Include Prisma engine files in output for serverless functions
  outputFileTracingIncludes: {
    '/api/**/*': [
      './prisma/generated/client/**/*',
      '../../packages/db/prisma/generated/client/**/*',
    ],
  },

  // Explicitly include Prisma files in the server bundle
  serverComponentsExternalPackages: ['prisma', '@prisma/client'],

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
