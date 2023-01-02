const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

module.exports = withBundleAnalyzer({
  transpilePackages: ["monaco-editor"],
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
    const rule = config.module.rules
      .find(rule => rule.oneOf)
      .oneOf.find(
        r =>
          // Find the global CSS loader
          r.issuer && r.issuer.include && r.issuer.include.includes("_app")
      );
    if (rule) {
      rule.issuer.include = [
        rule.issuer.include,
        // Allow `monaco-editor` to import global CSS:
        /[\\/]node_modules[\\/]monaco-editor[\\/]/
      ];
    }

    config.plugins.push(new MonacoWebpackPlugin({
      globalAPI: true,
      filename: 'static/[name].worker.js',
      customLanguages: [
        {
          label: 'yaml',
          entry: 'monaco-yaml',
          worker: {
            id: 'monaco-yaml/yamlWorker',
            entry: 'monaco-yaml/yaml.worker',
          },
        },
      ],
    }));

    return config
  },
  output: 'standalone',
})
