'use strict';

var angularcontext = require('../lib/main.js');

// This is just a basic test that we can even import the module.
exports.testOnDispose = function (test) {
    test.expect(2);
    var context = angularcontext.Context();

    var testsDone = 0;
    function oneTestDone() {
        testsDone++;
        if (testsDone === 2) {
            test.done();
        }
    }

    context.onDispose(
        function (passedInContext) {
            test.ok(context === passedInContext, 'onDispose callback gets the context as a param');
            oneTestDone();
        }
    );
    context.onDispose(
        function () {
            test.ok(true, 'the second callback was called too');
            oneTestDone();
        }
    );

    context.dispose();
};
