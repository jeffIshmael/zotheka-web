import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "https://blank-blank-pay.vercel.app";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@privy-io/react-auth"],
  async rewrites() {
    // Proxy API calls through Next.js so the browser avoids cross-origin (CORS) blocks.
    return [
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
