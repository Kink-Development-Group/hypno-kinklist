const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      if (env === 'production') {
        // Optimierungen für Produktionsbuild
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                parse: {
                  ecma: 8,
                },
                compress: {
                  ecma: 5,
                  warnings: false,
                  comparisons: false,
                  inline: 2,
                },
                mangle: {
                  safari10: true,
                },
                output: {
                  ecma: 5,
                  comments: false,
                  ascii_only: true,
                },
              },
              parallel: true,
            }),
            new CssMinimizerPlugin(),
          ],
          splitChunks: {
            chunks: 'all',
            name: false,
          },
          runtimeChunk: {
            name: entrypoint => `runtime-${entrypoint.name}`,
          },
        };
      }
      
      // Fügt Analyzer nur bei Bedarf hinzu (mit ANALYZE=true beim Build-Befehl)
      if (process.env.ANALYZE) {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin());
      }
      
      return webpackConfig;
    },
    plugins: [
      {
        plugin: MiniCssExtractPlugin,
        options: {
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        },
      },
    ],
  },
};
