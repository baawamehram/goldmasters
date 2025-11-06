/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode helps surface potential issues in production-like builds
  reactStrictMode: true,

  // Disable standalone mode for Netlify - it expects standard Next.js output
  // Standalone mode is good for Docker/self-hosted, but Netlify handles Next.js natively
  // output: process.env.CI || process.platform !== 'win32' ? 'standalone' : undefined,

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
