const path = require('path');

module.exports = {
  entry: './build/main.js',
  output: {
    filename: 'webpack-main.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'webtsp'
  }
};