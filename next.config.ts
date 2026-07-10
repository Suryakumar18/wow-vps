import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      // Hostinger VPS uploads (images/videos served from /uploads)
      { protocol: "http", hostname: "200.97.164.140" },
    ],
  },
  // Allow large page data for SSR
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // ssh2 ships a native binary (sshcrypto.node) that webpack can't bundle —
  // keep it as a real Node `require()` at runtime instead of trying to
  // process it through the webpack module graph.
  serverExternalPackages: ["ssh2"],
};

export default nextConfig;
