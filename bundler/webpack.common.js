/*
 * @Descripttion:
 * @version:
 * @Author: XYK
 * @Date: 2021-09-09 14:38:57
 * @LastEditors: XYK
 * @LastEditTime: 2021-09-10 17:59:57
 */

const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, '../src/script.js'),
  output:
    {
      filename: 'bundle.[contenthash].js',
      path: path.resolve(__dirname, '../dist')
    },
  devtool: 'source-map',
  plugins:
    [
      new CopyWebpackPlugin({
        patterns: [
          { from: path.resolve(__dirname, '../static') }
        ]
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../src/index.html'),
        minify: true
      }),
      new MiniCSSExtractPlugin()
    ],
  module:
    {
      rules:
        [
          // HTML
          {
            test: /\.(html)$/,
            use: ['html-loader']
          },

          // JS
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use:
                [
                  'babel-loader'
                ]
          },

          // CSS
          {
            test: /\.css$/,
            use:
                [
                  MiniCSSExtractPlugin.loader,
                  'css-loader'
                ]
          },

          // Images
          {
            test: /\.(jpg|png|gif|svg)$/,
            use:
                [
                  {
                    loader: 'file-loader',
                    options:
                        {
                          outputPath: 'assets/images/',
                          limit: 8 * 1024
                        }
                  }
                ]
          },

          // Fonts
          {
            test: /\.(ttf|eot|woff|woff2)$/,
            use:
                [
                  {
                    loader: 'file-loader',
                    options:
                        {
                          outputPath: 'assets/fonts/'
                        }
                  }
                ]
          }
        ]
    }
}
