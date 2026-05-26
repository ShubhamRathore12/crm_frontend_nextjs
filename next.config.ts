import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:8080"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
