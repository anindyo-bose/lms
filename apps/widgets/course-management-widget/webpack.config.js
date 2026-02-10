/**
 * Webpack configuration for Course Widget
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { container } = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const deps = require('./package.json').dependencies;

module.exports = {
  entry: './src/index',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: 'auto',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  devServer: {
    port: 3002,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          envName: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new container.ModuleFederationPlugin({
      name: 'courseWidget',
      filename: 'remoteEntry.js',
      remotes: {},
      exposes: {
        './CourseWidget': './src/CourseWidget',
        './CourseList': './src/components/CourseList',
        './CourseForm': './src/components/CourseForm',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: deps.react,
          eager: true,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom'],
          eager: true,
        },
        '@composey/shared-types': {
          singleton: true,
          requiredVersion: deps['@composey/shared-types'],
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    process.env.NODE_ENV === 'development' && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
};
