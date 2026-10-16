import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for Docker/Render. Omit on Vercel so the platform bundler owns the output.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  serverExternalPackages: ["bcrypt"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
};

export default nextConfig;
