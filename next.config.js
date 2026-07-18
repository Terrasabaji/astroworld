const nextConfig = {
  output: 'standalone',
  // Bundle the Python engine, ephemeris data, and seed fixtures into the
  // standalone server output so cloud/Docker hosts can calculate charts.
  outputFileTracingIncludes: {
    '/api/**': [
      './python_engine/**/*',
      './ephe/**/*',
      './data/seed/**/*',
      './data/users/.gitkeep',
      './data/births/.gitkeep',
    ],
  },
  outputFileTracingExcludes: {
    '/api/**': [
      './python_engine/.venv/**/*',
      './python_engine/**/__pycache__/**/*',
    ],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
    ],
  },
  // Renamed from experimental.serverComponentsExternalPackages in Next 15
  serverExternalPackages: ['mongodb'],
  webpack(config, { dev }) {
    if (dev) {
      // Reduce CPU/memory from file watching
      config.watchOptions = {
        poll: 2000, // check every 2 seconds
        aggregateTimeout: 300, // wait before rebuilding
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
