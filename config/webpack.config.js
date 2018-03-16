const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

const config = env => {
  return {
    mode: env.env,
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: 'app.bundle.js'
    },
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json'],
      alias: {
        vue: 'vue/dist/vue.js'
      }
    },
    devServer: {
      contentBase: path.resolve(__dirname, '../dist'),
      hot: true
    },
    devtool: 'eval-source-map',
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            esModule: true
          }
        },
        {
          test: /\.ts$/,
          exclude: /node_modules|vue\/src/,
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/]
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: `"${env.env}"`
        }
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: 'index.html',
        inject: true
      }),
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin()
    ]
  }
}

module.exports = config
