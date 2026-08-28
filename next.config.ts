import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "react-big-calendar",
    ],
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
