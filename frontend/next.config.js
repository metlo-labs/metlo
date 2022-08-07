module.exports = {
  async rewrites() {
    var backendURL = process.env.BACKEND_URL || 'http://localhost:8080'
    return [
      {
        source: "/api/:path*",
        destination: `${backendURL}/api/:path*`,
      },
    ];
  },
};
