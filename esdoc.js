var path = require('path');

module.exports = {
    source: path.join(__dirname, 'src'),
    destination: path.join(__dirname, 'esdoc'),
    coverage: true
};
