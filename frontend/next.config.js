const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})
module.exports = withBundleAnalyzer({
  async rewrites() {
    var backendURL = process.env.BACKEND_URL || "http://localhost:8080"
    return [
      {
        source: "/api/:path*",
        destination: `${backendURL}/api/:path*`,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: "/connections/new",
        destination: "/connections",
        permanent: true,
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        vm2: false,
        "isolated-vm": false,
        fs: false,
        module: false,
        "jest-util": false,
      }
    }
    return config
  },
  output: 'standalone',
})
