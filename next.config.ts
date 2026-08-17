import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
      },
      {
        protocol: "https",
        hostname: "ybluenflrggowqmgqdwx.supabase.co",
      },
    ],
  },
};

export default nextConfig;
