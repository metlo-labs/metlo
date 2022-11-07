const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const getAPIBaseURL = () => {
  return `${typeof window !== "undefined"
    ? window.location.origin
    : process.env.BACKEND_URL || "http://localhost:8080"
    }`
}
console.log(getAPIBaseURL())
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
      {
        source: "/auth/github",
        destination: `${getAPIBaseURL()}/auth/github`,
        permanent: false
      },
      // {
      //   source: "/auth/github/callback",
      //   destination: `${getAPIBaseURL()}/auth/github/callback`,
      //   permanent: false
      // }
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        vm2: false,
        fs: false,
        module: false,
        "jest-util": false,
      }
    }
    return config
  },
})
