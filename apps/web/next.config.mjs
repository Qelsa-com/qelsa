/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Blog covers are stored in Convex storage. Next serves resized WebP
    // variants so a 1K source never ships to a small card or phone viewport.
    formats: ["image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "**.convex.cloud", pathname: "/api/storage/**" },
      { protocol: "http", hostname: "localhost", pathname: "/api/storage/**" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/api/storage/**" },
    ],
  },
  // The floating dev indicator overlaps the agent composer's send button on
  // narrow screens, which makes the primary mobile action unclickable in dev.
  devIndicators: false,
  transpilePackages: ["@qelsa/backend"],
  turbopack: {
    resolveAlias: {
      canvas: "./src/lib/empty.js",
    },
  },
  async redirects() {
    return [
      {
        source: "/for_candidates",
        destination: "/candidates",
        permanent: true,
      },
      {
        source: "/for_candidate",
        destination: "/candidates",
        permanent: true,
      },
      {
        source: "/for-candidates",
        destination: "/candidates",
        permanent: true,
      },
      {
        source: "/for-candidate",
        destination: "/candidates",
        permanent: true,
      },
      {
        source: "/for_employers",
        destination: "/employers",
        permanent: true,
      },
      {
        source: "/for_employer",
        destination: "/employers",
        permanent: true,
      },
      {
        source: "/for-employers",
        destination: "/employers",
        permanent: true,
      },
      {
        source: "/for-employer",
        destination: "/employers",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/blogs",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/blogs/:slug",
        permanent: true,
      },
      {
        source: "/profile/work-experience",
        destination: "/profile?edit=experience",
        permanent: false,
      },
      {
        source: "/profile/skills",
        destination: "/profile?edit=skills",
        permanent: false,
      },
      {
        source: "/profile/skills/edit",
        destination: "/profile?edit=skills",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
