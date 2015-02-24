#!/usr/bin/env node
var yargs = require('yargs')
      .usage('Run the raster-eyes server.\nUsage: $0 [options]')
      .example('$0 --port 8100', 'run on port 8001')
      .example('$0 --cache node-cache', 'use node-cache as the request cache')
      .describe('host', 'Listen on this hostname (default: 127.0.0.1)')
      .describe('port', 'Listen on this port (default: 9000)')
      .describe('cache', 'Load this module as request cache.\nAlternatively: --cache.module=name --cache.option=option')
      .describe('static', 'serve static files from the cwd alongside /raster-eyes/')
      .alias('static', 's')
      .alias('cache', 'c')
      .alias('host', 'H')
      .alias('port', 'p')
      .alias('h', 'help')
      .wrap(80),
    options = yargs.parse(process.argv),
    args = options._,
    re = require('./index'),
    extend = re.util.extend,
    fs = require('fs');

if (options.help) {
  yargs.showHelp();
  return process.exit();
}

// delete the weird keys in the options object
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
  var isCacheObject = (typeof options.cache === "object")
  var cacheModule = isCacheObject
        ? require(options.cache.module)
        : require(options.cache),
      cacheOptions = isCacheObject
        ? options.cache
        : {};
  options.cache = ('get' in cacheModule)
    ? cacheModule
    : new cacheModule(cacheOptions);
}

var server = re.web.server(options, function(error) {
  if (error) return console.error('Failed to start:', error);
  var addr = server.address();
  console.log('raster-eyes listening on http://%s:%d', addr.address, addr.port);
});
