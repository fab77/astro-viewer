import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENTRY = path.resolve(__dirname, 'src/index.ts');
const OUT = path.resolve(__dirname, 'dist');

export default (_, argv = {}) => {
  const isProduction = argv.mode === 'production';

  const common = {
    entry: ENTRY,

    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      extensionAlias: {
        '.js': ['.ts', '.js'],
        '.mjs': ['.mts', '.mjs']
      },
      conditionNames: ['import', 'module', 'browser', 'default']
    },

    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/i,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: isProduction
                ? 'tsconfig.build.json'
                : 'tsconfig.json'
            }
          },
          exclude: /node_modules/
        }
      ]
    },

    plugins: [
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        resource => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      ),

      new webpack.DefinePlugin({
        __APP_VERSION__: JSON.stringify(pkg.version)
      })
    ],

    devtool: 'source-map'
  };

  const browserConfig = {
    ...common,

    name: 'browser',

    target: 'web',

    output: {
      path: OUT,
      filename: 'astroviewer.js',
      library: 'astroviewer',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: 'self'
    },

    optimization: {
      splitChunks: false,
      runtimeChunk: false,
      minimize: false
    }
  };

  const browserMinConfig = {
    ...common,

    name: 'browser-min',

    target: 'web',

    output: {
      path: OUT,
      filename: 'astroviewer.min.js',
      library: 'astroviewer',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: 'self'
    },

    optimization: {
      splitChunks: false,
      runtimeChunk: false,
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false
        })
      ]
    }
  };

  const cjsConfig = {
    ...common,

    name: 'cjs',

    target: 'node',

    output: {
      path: OUT,
      filename: 'astroviewer.cjs',
      libraryTarget: 'commonjs2'
    },

    optimization: {
      splitChunks: false,
      runtimeChunk: false,
      minimize: false
    }
  };

  return [
    browserConfig,
    browserMinConfig,
    cjsConfig
  ];
};