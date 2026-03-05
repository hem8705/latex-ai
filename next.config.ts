import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-latex-compiler"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
