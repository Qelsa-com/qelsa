/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ];
  },
};

export default nextConfig;
