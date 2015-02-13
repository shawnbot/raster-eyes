var pkg = require('./package.json');

module.exports = {
  version:  pkg.version,
  capture:  require('./lib/capture'),
  web:      require('./lib/web'),
  cache:    require('./lib/cache'),
  util:     require('./lib/util')
};
