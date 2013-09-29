'use strict';

var jsdom = require('jsdom');
var fs = require('fs');

var Context = function () {
    // We provide an empty DOM that allows some basic parts of AngularJS to work,
    // but we're not actually expecting to render an app in here... it just gives
    // us an anchor document so we can do things like call document.createElement
    // when using jqLite/jQuery.
    var document = jsdom.jsdom(
        null,
        null,
        {
            // Don't do anything with external resources, since we're not actually
            // trying to emulate a browser here, just a DOM.
            FetchExternalResources: false,
            ProcessExternalResources: false,
            SkipExternalResources: false
        }
    );
    var window = document.parentWindow;
    // 'window' has already been contextified by jsdom, so we can just use it.
    var rawContext = window;

    return {
        run: function (source, filename) {
            rawContext.run(source, filename);
        },

        runFile: function (fileName, callback) {
            fs.readFile(
                fileName,
                'utf8',
                function (err, data) {
                    if (err) {
                        callback(undefined, err);
                    }
                    else {
                        callback(rawContext.run(data, fileName));
                    }
                }
            );
        },

        hasAngular: function () {
            return typeof rawContext.angular === 'object';
        },

        getAngular: function () {
            return rawContext.angular;
        },

        module: function () {
            return rawContext.angular.module.apply(
                rawContext.angular.module,
                arguments
            );
        },

        injector: function (modules) {
            return rawContext.angular.injector(modules);
        },

        dispose: function () {
            rawContext.dispose();
        }
    };
};

exports.Context = Context;
