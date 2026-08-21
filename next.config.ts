import type { NextConfig } from "next";

const wpHost = new URL(process.env.WP_URL ?? "https://wp.agfasgas.com").hostname;

const nextConfig: NextConfig = {
  images: {
    // WordPress media library is the source of all product and post imagery.
    remotePatterns: [
      { protocol: "https", hostname: wpHost, pathname: "/**" },
      { protocol: "https", hostname: "secure.gravatar.com", pathname: "/**" },
    ],
    // Woo product galleries are re-shot often enough that a day is plenty.
    minimumCacheTTL: 86400,
    qualities: [60, 75, 90],
  },
};

export default nextConfig;
