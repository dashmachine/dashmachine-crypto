const config = {
    entry: ['./src/crypto.service.js'],
    output: {
      path: __dirname + '/build',
      filename: 'dashmachine-crypto-lib.js',
      libraryTarget: 'var',
     library: 'CryptoService'
    },
    module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          }
        ]
    },
    resolve: {
      extensions: ['.js']
    },
    devServer:{
      port: 3030,
      contentBase: __dirname + '/build',
      inline: true
    }
}
module.exports = config;