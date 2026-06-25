import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Truth-Estate",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
