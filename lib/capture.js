var phantom = require('phantom'),
    async = require('async'),
    extend = require('util-extend'),
    path = require('path'),
    os = require('os'),
    fs = require('fs');

var capture = function(url, options, done) {
  options = extend(capture.defaults, options);

  function setOptions(page) {
    if (options.viewport) {
      page.set('viewportSize', getViewport(options.viewport));
    }
    if (options.zoom && options.zoom !== 1) {
      page.set('zoomFactor', +options.zoom);
    }
  }

  var _ph,
      i = 0,
      logStep = function(log) {
        return function() {
          log.apply(console, [++i + '.'].concat([].slice.call(arguments)));
        };
      },
      log = logStep(console.log),
      warn = logStep(console.warn);
  return async.waterfall([
    function createPhantom(next) {
      return phantom.create(function(ph) {
        return next(null, _ph = ph);
      });
    },
    function createPage(ph, next) {
      return ph.createPage(function(page) {
        return next(null, page);
      });
    },
    function open(page, next) {
      setOptions(page);
      page.open(url, function(status) {
        if (status === 'fail') return next('Failed to load: ' + url);
        if (options.delay) {
          log('delaying by', options.delay, 'ms...');
          setTimeout(function() {
            next(null, page);
          }, options.delay);
        } else {
          next(null, page);
        }
      });
    },
    function findRect(page, next) {
      page.evaluate(function establishViewport(opts) {
        if (opts.selector) {
          var el = document.querySelector(opts.selector);
          return el ? el.getBoundingClientRect() : opts;
        } else {
          return {message: 'no selector', options: opts};
        }
      }, function(rect) {
        log('viewport:', rect);
        if (rect && rect.width) {
          page.set('clipRect', rect);
        } else if (options.cliprect) {
          page.set('clipRect', getRect(options.cliprect));
        }
        next(null, page);
      }, options);
    },
    function render(page, next) {
      var format = options.format || 'png',
          quality = options.quality || 100,
          filename = path.join(os.tmpdir(), [
            'raster-eyes.', Date.now(),
            '@', quality,
            '.', format
          ].join('')),
          renderOptions = {
            format: format,
            quality: quality
          };

      log('rendering:', filename, renderOptions);
      page.render(filename, renderOptions, function(error) {
        next(error, {
          type: 'image/' + format,
          filename: filename
        });
      });
    },
    function read(image, next) {
      log('reading:', image.filename);
      return async.waterfall([
        function(step) {
          return fs.readFile(image.filename, step);
        },
        function(buffer, step) {
          image.data = buffer;
          log('unlinking:', image.filename);
          fs.unlink(image.filename, function(error) {
            if (error) return step(error);
            delete image.filename;
            step(null, image);
          });
        }
      ], next);
    }
  ], function(error, image) {
    log('killing the ghost');
    _ph.exit();
    done(error, image);
  });
};

capture.defaults = {
  viewport: {
    width: 1024,
    height: 768
  },
  clipRect: null,
  delay: 100,
  zoom: 1
};

function getViewport(viewport) {
  if (typeof viewport === 'string') {
    var bits = viewport.split(/[x,]/);
    return {
      width: +bits[0],
      height: +bits[1]
    };
  }
  return viewport;
}

function getRect(rect) {
  if (typeof rect === 'string') {
    var bits = rect.split(/[x,]/);
    return {
      left: +bits[0],
      top: +bits[1],
      width: +bits[2],
      height: +bits[3]
    };
  }
  return rect;
}

module.exports = capture;
