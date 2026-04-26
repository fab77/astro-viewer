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

export default (_, argv = {}) => {
  const isProduction = argv.mode === 'production';

  const common = {
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      extensionAlias: {
        '.js': ['.ts', '.js'],   // import './x.js' -> prefer './x.ts' at build time
        '.mjs': ['.mts', '.mjs']
      }
    },
    module: {
      rules: [{
        test: /\.(ts|tsx)$/i,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            configFile: isProduction ? 'tsconfig.build.json' : 'tsconfig.json'
          }
        },
        exclude: /node_modules/
      }]
    },
    optimization: { splitChunks: false, runtimeChunk: false },
    devtool: isProduction ? false : 'source-map',
    plugins: [
      new webpack.NormalModuleReplacementPlugin(/^node:/, r => { r.request = r.request.replace(/^node:/, ''); }),
      new webpack.DefinePlugin({ __APP_VERSION__: JSON.stringify(pkg.version) }),
    ],
  };

  const umdConfig = {
    ...common,
    target: 'web',
    entry: {
      'astroviewer': ENTRY,
      'astroviewer.min': ENTRY,
    },
    output: {
      path: OUT,
      filename: '[name].js',
      library: 'astroviewer',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: 'self',
    },
  };

  const cjsConfig = {
    ...common,
    target: 'node',
    entry: ENTRY,
    output: {
      path: OUT,
      filename: 'astroviewer.cjs',
      libraryTarget: 'commonjs2',
    },
    optimization: { splitChunks: false, runtimeChunk: false, minimize: false }
  };

  return [umdConfig, cjsConfig];
};

