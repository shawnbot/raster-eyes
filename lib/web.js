var express = require('express'),
    extend = require('./util').extend,
    minimatch = require('minimatch'),
    _url = require('url'),
    querystring = require('querystring'),
    async = require('async'),
    capture = require('./capture');

var middleware = function(options) {
  options = extend({}, middleware.defaults, options);

  // console.log('middleware options:', options);
  var cache = options.cache || emptyCache(),
      validDomain = domainValidator(options.whitelist, options.blacklist);

  function getCacheKey(url, query) {
    var qs = extend({}, query);
    delete qs.url;
    return Object.keys(qs).length
      ? [url, querystring.stringify(qs)].join('?')
      : url;
  }

  return function rasterEyesMiddleware(req, res, next) {
    var query = req.query,
        url = query.url || req.path.replace(/^\//, ''),
        actualUrl = url.match(/^https?:\/\//) ? url : 'http://' + url,
        parsed = _url.parse(actualUrl),
        domain = parsed.host,
        key = getCacheKey(url, query);

    // console.log('url:', url, 'options:', query, 'key:', key);

    if (!domain || !validDomain(domain)) {
      console.error('invalid domain:', domain);
      return res
        .status(403)
        .send('Bad domain: "' + domain + '"');
    } else {
      // console.log('valid domain:', domain);
    }

    function readCache(next) {
      cache.get(key, function(error, data) {
        if (error) return next(error);
        next(null, data ? data[key] : null);
      });
    }

    function captureIfNotCached(cached, next) {
      if (cached) {
        console.log("cached:", key);
        return next(null, cached);
      }
      console.log("not cached:", key);
      capture(url, query, function(error, image) {
        if (error) return next(error);
        console.log("caching:", key);
        cache.set(key, image, function(error) {
          if (error) {
            console.warn('unable to cache:', error);
          }
          next(null, image);
        });
      });
    }

    return async.waterfall([
      readCache,
      captureIfNotCached
    ], function(error, image) {
      if (error) {
        return res
          .status(500)
          .send('Something went wrong: ' + error + '\n');
      }

      if (options.download) {
        res.download(options.download);
      }
      return res
        .set('Content-Type', image.type)
        // TODO Date-Modified, etc.
        .send(image.data);
    });
  };
};

middleware.defaults = {
  // an optional cache with the following methods:
  // cache.set(key, val, callback);
  // cache.get(key, callback);
  cache: null,
  // if non-null, this is interpreted as either a single domain
  // or a list of allowed domains
  whitelist: null,
  // if no whitelist is provided, the blacklist allows you to
  // exclude specific domains
  blacklist: []
};

var server = function(options, done) {
  // console.log('server options:', options);
  options = extend({}, server.defaults, options);
  return express()
    .use(options.path, middleware(options))
    .listen(options.port, options.hostname, done);
};

server.defaults = {
  // listen hostname and port
  hostname: process.env.HOST || '127.0.0.1',
  port: process.env.PORT || 9000,
  // base path for all raster-eyes requests
  path: '/raster-eyes/',
};

module.exports = {
  middleware: middleware,
  server: server
};

function emptyCache() {
  // console.log('(using no cache)');
  return {
    get: function(key, done) {
      return done ? done() : undefined;
    },
    set: function(key, val, done) {
      done && done();
    }
  };
}

function domainValidator(whitelist, blacklist) {
  if (whitelist) {

    whitelist = Array.isArray(whitelist)
      ? whitelist
      : whitelist.split(',');
    return function(domain) {
      return whitelist.some(function(pattern) {
        return minimatch(domain, pattern);
      });
    };

  } else if (blacklist) {

    blacklist = Array.isArray(blacklist)
      ? blacklist
      : blacklist.split(',');
    return function(domain) {
      return !blacklist.some(function(pattern) {
        return minimatch(domain, pattern);
      });
    };

  }

  return function() { return true; };
}
