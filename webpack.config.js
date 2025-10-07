import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack'
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const pkg = require('./package.json');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const ENTRY = path.resolve(__dirname, 'src/index.ts');
const OUT = path.resolve(__dirname, 'dist');

const common = {
  // ...
  // resolve: { extensions: ['.ts', '.tsx', '.js'] },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    extensionAlias: {
      '.js': ['.ts', '.js'],   // import './x.js' -> prefer './x.ts' at build time
      '.mjs': ['.mts', '.mjs']
    }
  },  
  module: { rules: [{ test: /\.(ts|tsx)$/i, use: 'ts-loader', exclude: /node_modules/ }] },
  optimization: { splitChunks: false, runtimeChunk: false },
  devtool: 'source-map',
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^node:/, r => { r.request = r.request.replace(/^node:/, ''); }),
    new webpack.DefinePlugin({ __APP_VERSION__: JSON.stringify(pkg.version) }),
  ],
};

// UMD build (normal + min)
const umdConfig = {
  ...common,
  target: 'web',
  entry: {
    'astrocore': ENTRY,           // <-- plain string
    'astrocore.min': ENTRY,     // <-- plain string
  },
  output: {
    path: OUT,
    filename: '[name].js',
    library: 'astrocore',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'self',
  },
};

// CJS build
const cjsConfig = {
  ...common,
  target: 'node',
  entry: ENTRY,                  // <-- plain string
  output: {
    path: OUT,
    filename: 'astrocore.cjs',
    libraryTarget: 'commonjs2',
  },
  optimization: { splitChunks: false, runtimeChunk: false, minimize: false }
};



// const browserConfig = {
//   ...common,
//   entry: {
//     'astrocore': [PATHS.entryPoint4Browser],
//     'astrocore.min': [PATHS.entryPoint4Browser]
//   },
//   target: 'web',
//   externals: {},
//   output: {
//     path: PATHS.bundles,
//     libraryTarget: 'umd',
//     library: 'astrocore',
//     umdNamedDefine: true
//   },
//   resolve: {
//     extensions: ['.ts', '.tsx', '.js'],
//     extensionAlias: {
//       '.js': ['.ts', '.js'],
//       '.mjs': ['.mts', '.mjs']
//     }
//   },
//   devtool: 'source-map',
//   plugins: [
//     new MiniCssExtractPlugin({
//       filename: '[name].css',
//       chunkFilename: '[id].css',
//     }),
//     new webpack.ProvidePlugin({
//       Buffer: ['buffer', 'Buffer'],
//     }),
//     new webpack.NormalModuleReplacementPlugin(
//       /^node:/,
//       (resource) => {
//         resource.request = resource.request.replace(/^node:/, '');
//       },
//     ),
//     new CopyPlugin({
//       patterns: [
//         { from: "src/media", to: "images" },
//         { from: "src/css", to: "stylesheets" }
//       ],
//     }),
//   ],
//   module: {

//     rules: [
//       {
//         test: /\.css$/,
//         use: ['style-loader', 'css-loader'],
//       },
//       {
//         test: /\.(png|svg|jpg|jpeg|gif)$/i,
//         type: 'asset/resource',
//       },
//     ],
//   }
// }

export default [umdConfig, cjsConfig];



