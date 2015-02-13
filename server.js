var yargs = require('yargs'),
    options = yargs.parse(process.argv),
    args = options._,
    re = require('./index'),
    extend = re.util.extend,
    fs = require('fs');

['_', '$0'].forEach(function(key) {
  delete options[key];
});

if (options.config) {
  var config = JSON.parse(fs.readFileSync(options.config, {
    encoding: 'utf8'
  }));
  extend(options, options.config);
  delete options.config;
}

if (options.cache) {
  console.log('using cache:', options.cache);
  var cache = require(options.cache);
  options.cache = ('get' in cache)
    ? cache
    : new cache();
}

var server = re.web.server(options, function(error) {
  if (error) return console.error('Failed to start:', error);
  var addr = server.address();
  console.log('raster-eyes listening on http://%s:%d', addr.address, addr.port);
});
