var extend = require('./util').extend,
    Cache = require('node-cache'),
    defaults = {
      stdTTL: 5 * 60 // default: cache for 5 minutes
    };

module.exports = function(options) {
  options = extend({}, defaults, options);
  return new Cache(options);
};
