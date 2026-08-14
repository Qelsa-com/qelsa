/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@qelsa/backend"],
  turbopack: {
    resolveAlias: {
      canvas: "./src/lib/empty.js",
    },
  },
};

export default nextConfig;
