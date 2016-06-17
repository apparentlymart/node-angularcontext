'use strict';

var angularcontext = require('../lib/main.js');

// This is just a basic test that we can even import the module.
exports.testGetInjector = function (test) {
    var context = angularcontext.Context();

    context.runFile(
        'res/fakeangular.js',
        function (result, error) {
			var injector = context.injector(['ng']);

            test.ok(injector, 'injector was returned');

            var fake = injector.get('anything');
            test.ok(fake.fake, 'injector is fake');

            test.done();
        }
    );
};
