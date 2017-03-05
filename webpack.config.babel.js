import { DefinePlugin, optimize } from 'webpack'
import { resolve } from 'path'
const { UglifyJsPlugin, OccurrenceOrderPlugin } = optimize
import ExtractTextPlugin from 'extract-text-webpack-plugin'

const exposed = [
  'NODE_ENV'
]
const exposedEnvironment = {}
exposed.forEach(i => { exposedEnvironment[i] = JSON.stringify(process.env[i]) })

const config = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    app: [
      './src/index.js',
      'webpack/hot/only-dev-server'
    ]
  },
  output: {
    path: resolve(__dirname, './webroot/build'),
    publicPath: '/build/',
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.jsx?$/i, exclude: /(node_modules)/, loader: 'babel-loader' },
      { test: /\.json$/i, loaders: ['json-loader'] },
      { test: /\.css$/i, loader: ExtractTextPlugin.extract(['css-loader']) },
      { test: /\.scss$/i, loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader']) }
    ]
  },
  plugins: [
    new OccurrenceOrderPlugin(),
    new DefinePlugin({
      'process.env': exposedEnvironment
    }),
    new ExtractTextPlugin('app.css')
  ]
}

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(new UglifyJsPlugin({sourceMap: false, output: {comments: false}}))
}

export default config
