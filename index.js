var pkg = require('./package.json');

module.exports = {
  version:  pkg.version,
  capture:  require('./lib/capture'),
  web:      require('./lib/web'),
  util:     require('./lib/util')
};
