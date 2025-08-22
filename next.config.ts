import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'i.pinimg.com',
      pathname: '/1200x/**',
    },
  ],
}

};

export default nextConfig;
