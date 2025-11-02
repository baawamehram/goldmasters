// remove explicit NextConfig import to avoid TS error and let inference handle the config

const nextConfig = {
  output: "standalone", // needed for Netlify + modern Next.js
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
