'use strict';

var angularcontext = require('../lib/main.js');

// This is just a basic test that we can even import the module.
exports.testRunFile = function (test) {
    var context = angularcontext.Context();

    context.runFile(
        'res/fakeangular.js',
        function (result, error) {
            test.ifError(error, 'Run file returned error');

            test.ok(result, 'runFile returned a result');

            test.done();
        }
    );
};
