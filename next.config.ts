import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // webpack:(config)=>{
  //   config.resolve.alias.canvas = false;
  // },
  images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'i.pinimg.com',
      pathname: '/1200x/**',
    },
    {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**', 
      },
  ],
}

};

export default nextConfig;
