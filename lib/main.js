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
            features: {
                // Don't do anything with external resources, since we're not actually
                // trying to emulate a browser here, just a DOM.
                FetchExternalResources: false,
                ProcessExternalResources: false,
                SkipExternalResources: false
            }
        }
    );
    var window = document.parentWindow;
    // 'window' has already been contextified by jsdom, so we can just use it.
    var rawContext = window;

    var runFiles = function (filenames, callback) {
        var loadedCount = 0;
        var firstError;
        var sources = [];
        sources.length = filenames.length;

        var runSources = function () {
            if (firstError) {
                callback(false, firstError);
            }
            else {
                // now run the sources in the correct order
                try {
                    for (var i = 0; i < sources.length; i++) {
                        rawContext.run(sources[i], filenames[i]);
                    }
                }
                catch (err) {
                    firstError = err;
                    callback(false, err);
                }
            }
            if (! firstError) {
                callback(true);
            }
        };

        var makeLoadHandler = function (i) {
            return function (err, data) {
                loadedCount++;
                if (err) {
                    if (! firstError) {
                        firstError = err;
                    }
                }
                else {
                    sources[i] = data;
                }
                if (loadedCount === filenames.length) {
                    // we've got everything loaded, so now run them
                    runSources();
                }
            };
        };

        for (var i = 0; i < filenames.length; i++) {
            fs.readFile(
                filenames[i],
                'utf8',
                makeLoadHandler(i)
            );
        }

    };

    return {
        run: function (source, filename) {
            rawContext.run(source, filename);
        },

        runFile: function (fileName, callback) {
            runFiles([fileName], callback);
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

        runFiles: runFiles,

        hasAngular: function () {
            return typeof rawContext.angular === 'object';
        },

        getAngular: function () {
            return rawContext.angular;
        },

        hasRequire: function () {
            return typeof rawContext.require === 'object';
        },

        getRequire: function () {
            return rawContext.require;
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

        bootstrap: function (element, modules) {
            return rawContext.angular.bootstrap(element, modules);
        },

        element: function (param) {
            return rawContext.angular.element(param);
        },

        dispose: function () {
            window.close();
        }
    };
};

exports.Context = Context;
