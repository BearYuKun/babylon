/*
 * @Descripttion:
 * @version:
 * @Author: XYK
 * @Date: 2021-09-09 14:38:57
 * @LastEditors: XYK
 * @LastEditTime: 2021-09-10 18:01:13
 */
const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = merge(
  commonConfiguration,
  {
    mode: 'production',
    plugins:
        [
          new CleanWebpackPlugin()
        ]
  }
)
