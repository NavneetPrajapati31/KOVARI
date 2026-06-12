try {
  (function() {
    var noop = function() {};
    var methods = ['log', 'debug', 'info', 'warn', 'error', 'dir', 'table', 'clear', 'time', 'timeEnd', 'trace', 'assert', 'group', 'groupCollapsed', 'groupEnd'];
    for (var i = 0; i < methods.length; i++) {
      window.console[methods[i]] = noop;
    }
  })();
} catch (e) {}
