import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploaded assets are written to public/uploads at runtime and served as-is.
  images: { unoptimized: true },
};

export default nextConfig;
