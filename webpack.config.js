const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin')
const {
  BundleDeclarationsWebpackPlugin,
} = require('bundle-declarations-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production'

const config = {
  mode: isProd ? 'production' : 'development',
  entry: {
    index: './src/index.ts',
    'mpc-webview-client': './src/webview/mpc.client.webview.ts',
    'mpc-webview-sdk': './src/webview/index.webview.ts',
    'mpc-worker-client': './src/worker/MPCWorkerClient.ts',
    'mpc-worker-sdk': './src/worker/MPCWorkerBridge.ts',
  },
  devtool: false,
  watch: !isProd,
  watchOptions: {
    ignored: /node_modules/,
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, 'lib'),
    filename: '[name].js',
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts', '...'],
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        use: [
          {
            loader: 'webassembly-loader',
            options: {
              export: 'buffer',
            },
          },
        ],
      },
      {
        test: /\.(ts|js)$/u,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'MPC.html',
      chunks: ['mpc-webview-sdk'],
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
          declaration: true,
        },
      },
      formatter: {
        type: 'codeframe',
        pathType: 'absolute',
      },
      async: false,
      issue: {
        include: [{ file: '**/src/**/*', severity: 'error' }],
      },
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'src/mpc-assembly/SafeheronCMP.wasm',
        },
      ],
    }),
    new HtmlInlineScriptPlugin({
      scriptMatchPattern: [/mpc-webview-sdk.js$/],
      htmlMatchPattern: [/MPC.html$/],
    }),
  ],
  stats: 'minimal',
  optimization: {
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        exclude: /SafeheronCMP.wasm/,
        extractComments: false,
        minify: TerserPlugin.swcMinify,
      }),
    ],
  },
}

// ----------- generate types --------------
const entries = config.entry
Object.entries(entries).forEach(([entryName, entryPath]) => {
  config.plugins.push(
    new BundleDeclarationsWebpackPlugin({
      entry: {
        filePath: entryPath,
      },
      outFile: entryName + '.d.ts',
    }),
  )
})

const smp = new SpeedMeasurePlugin({
  disabled: true,
})

// module.exports = smp.wrap(config)

module.exports = config
