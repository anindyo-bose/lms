/**
 * Shell App - Main Next.js wrapper with Module Federation
 * Next.js configuration with webpack plugin for Module Federation
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Module Federation disabled until widgets are built
  // Uncomment and configure when ready for MFE integration
  /*
  webpack: (config, options) => {
    const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
    config.plugins.push(
      new NextFederationPlugin({
        name: 'shell',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          authWidget: 'authWidget@http://localhost:3001/remoteEntry.js',
          courseWidget: 'courseWidget@http://localhost:3002/remoteEntry.js',
          lessonWidget: 'lessonWidget@http://localhost:3003/remoteEntry.js',
          quizWidget: 'quizWidget@http://localhost:3004/remoteEntry.js',
          progressWidget: 'progressWidget@http://localhost:3005/remoteEntry.js',
          checkoutWidget: 'checkoutWidget@http://localhost:3006/remoteEntry.js',
        },
        shared: {
          react: { singleton: true, eager: true },
          'react-dom': { singleton: true, eager: true },
        },
      })
    );
    return config;
  },
  */
};

module.exports = nextConfig;
