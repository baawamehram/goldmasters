/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode helps surface potential issues in production-like builds
  reactStrictMode: true,

  // Produce a standalone server output (good for Netlify/Vercel and Docker)
  // Only enable on CI/CD or when not on Windows to avoid symlink permission issues
  output: process.env.CI || process.platform !== 'win32' ? 'standalone' : undefined,

  experimental: {
    // Enable Server Actions in production
    serverActions: {},
    // Include Prisma engine files in output
    outputFileTracingIncludes: {
      '/*': [
        '../../packages/db/prisma/generated/client/**/*',
        '../../packages/db/node_modules/.prisma/client/**/*',
        '../../packages/db/node_modules/@prisma/client/**/*',
      ],
    },
  },

  typescript: {
    // Permit production builds even if type errors exist
    ignoreBuildErrors: true,
  },

  // Webpack configuration to handle Prisma engine files
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'prisma': 'commonjs prisma',
        '@prisma/client': 'commonjs @prisma/client',
      });
    }
    return config;
  },
};

export default nextConfig;
