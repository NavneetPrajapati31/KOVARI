import { withSentryConfig } from "@sentry/nextjs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
  // Add webpack optimization settings
  webpack: (config, { dev, isServer }) => {
    // Optimize cache settings based on environment
    config.cache = dev
      ? {
          type: "memory",
        }
      : {
          type: "filesystem",
          buildDependencies: {
            config: [__filename],
          },
          cacheDirectory: path.resolve(__dirname, ".next/cache"),
          maxAge: 172800000, // 2 days
          compression: "gzip",
          store: "pack",
          version: "1.0.0",
          allowCollectingMemory: true,
          memoryCacheUnaffected: true,
          serialization: {
            serialize: (data) => {
              if (typeof data === "string" && data.length > 1024) {
                return Buffer.from(data);
              }
              return data;
            },
            deserialize: (data) => {
              if (Buffer.isBuffer(data)) {
                return data.toString();
              }
              return data;
            },
          },
        };

    // Handle Supabase realtime-js dependency
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ws: false,
      net: false,
      tls: false,
      fs: false,
      dns: false,
      child_process: false,
    };

    // Optimize chunk size and string handling
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // Only add minimizer in production
    if (!dev) {
      config.optimization.minimize = true;
      config.optimization.minimizer = [
        "...",
        new (require("terser-webpack-plugin"))({
          terserOptions: {
            compress: {
              drop_console: true,
            },
            format: {
              comments: false,
            },
          },
        }),
      ];
    }

    // Add performance hints only in production
    if (!dev) {
      config.performance = {
        hints: "warning",
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      };
    }

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "kovari",
  project: "javascript-nextjs",

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
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
