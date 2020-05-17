const config = {
  entry: ['./src/dashmachine-crypto.js'],
  output: {
    path: __dirname + '/build',
    filename: 'dashmachine-crypto-lib.js',
    libraryTarget: 'var',
    library: 'DashmachineCrypto'
  },
  externals: {

    "dash": "Dash"

  },
  module: {
    rules: [
      {
        test: [/\.js$/, /\.jsx?$/],
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-transform-runtime'],
        },
      }]
  },
  resolve: {
    extensions: ['.js']
  },
  devServer: {
    port: 3030,
    contentBase: __dirname + '/build',
    inline: true
  }
}
module.exports = config;