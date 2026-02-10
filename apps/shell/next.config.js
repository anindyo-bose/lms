/**
 * Shell App - Main Next.js wrapper with Module Federation
 * Next.js configuration with webpack plugin for Module Federation
 */

const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, options) => {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'shell',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          authWidget: path.resolve(__dirname, '../widgets/auth-widget/dist'),
          courseWidget: path.resolve(__dirname, '../widgets/course-management-widget/dist'),
          lessonWidget: path.resolve(__dirname, '../widgets/lesson-viewer-widget/dist'),
          quizWidget: path.resolve(__dirname, '../widgets/quiz-engine-widget/dist'),
          progressWidget: path.resolve(__dirname, '../widgets/progress-tracker-widget/dist'),
          checkoutWidget: path.resolve(__dirname, '../widgets/checkout-widget/dist'),
        },
        exposes: {},
        shared: {
          react: {
            singleton: true,
            requiredVersion: false,
            eager: true,
            shareKey: 'react',
            shareScope: 'default',
          },
          'react-dom': {
            singleton: true,
            requiredVersion: false,
            eager: true,
            shareKey: 'react-dom',
            shareScope: 'default',
          },
          '@composey/shared-types': {
            singleton: true,
            requiredVersion: false,
          },
        },
      })
    );

    return config;
  },
};

module.exports = nextConfig;
