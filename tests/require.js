'use strict';

// This is just a basic test that we can even import the module.
exports.testRequire = function (test) {
    var angularcontext = require('../lib/main.js');
    test.ok(angularcontext, 'angularcontext is truthy');
    test.done();
};
