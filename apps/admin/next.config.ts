import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['redis', '@getbrevo/brevo'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@heroui/react', '@heroui/theme'],
  webpack: (config, { isServer }) => {
    // Fix broken internal requires in sib-api-v3-sdk (expects bare 'ApiClient', 'model', 'api')
    const path = require('path');
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      ApiClient: path.resolve(__dirname, "../../node_modules/sib-api-v3-sdk/src/ApiClient"),
      model: path.resolve(__dirname, "../../node_modules/sib-api-v3-sdk/src/model"),
      api: path.resolve(__dirname, "../../node_modules/sib-api-v3-sdk/src/api"),
    };

    // Exclude sib-api-v3-sdk from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      // Mark sib-api-v3-sdk as external for client bundle
      const originalExternals = config.externals || [];
      config.externals = [
        ...(Array.isArray(originalExternals)
          ? originalExternals
          : [originalExternals]),
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (
            request === "sib-api-v3-sdk" ||
            request?.startsWith("sib-api-v3-sdk/")
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'kovari',

  project: 'kovari-admin',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  // Note: These options are deprecated but still functional
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  // Note: This option is deprecated but still functional
  automaticVercelMonitors: true,
});
