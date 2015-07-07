var path = require('path');

module.exports = {
    path: path.resolve(__dirname),
    rootPath: path.resolve(__dirname),
    testEntryPoint: path.join(__dirname, 'test', 'index.js'),
    esdocConfig: path.join(__dirname, 'esdoc.js'),
    webpackConfig: {
        production: require('./webpack.config.js'),
    },
};
