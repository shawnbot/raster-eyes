module.exports = {
  extend: function extend(obj) {
    [].slice.call(arguments, 1).forEach(function(ext) {
      if (!ext) return;
      for (var key in ext) {
        obj[key] = ext[key];
      }
    });
    return obj;
  },

  stepper: function logger(_console) {
    _console = _console || console;
    var methods = ['log', 'info', 'warn', 'error'],
        logger = {},
        _step = 0,
        wrap = function wrapper(log) {
          return function wrapped() {
            var args = [].slice.call(arguments);
            log.apply(_console, [++_step + '.'].concat(args));
          };
        };
    methods.forEach(function(method) {
      logger[method] = wrap(_console[method]);
    });
    return logger;
  }
};
