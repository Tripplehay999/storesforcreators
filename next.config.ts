import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A package-lock.json in the home folder otherwise confuses root detection.
  turbopack: { root: __dirname },
  async redirects() {
    return [{ source: "/studio", destination: "/dashboard/products", permanent: false }];
  }
};

export default nextConfig;
