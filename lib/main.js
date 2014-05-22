'use strict';

var jsdom = require('jsdom');
var fs = require('fs');

var Context = function (template) {
    // We provide an empty DOM that allows some basic parts of AngularJS to work,
    // but we're not actually expecting to render an app in here... it just gives
    // us an anchor document so we can do things like call document.createElement
    // when using jqLite/jQuery.
    var document = jsdom.jsdom(
        template,
        null,
        {
            features: {
                // Don't do anything with external resources, since we're not actually
                // trying to emulate a browser here, just a DOM.
                FetchExternalResources: false,
                ProcessExternalResources: false,
                SkipExternalResources: false,
                MutationEvents: false
            }
        }
    );
    var window = document.parentWindow;
    // 'window' has already been contextified by jsdom, so we can just use it.
    var rawContext = window;
    var disposeCallbacks = [];

    // Run some code in the context, then run a callback.
    // The first parameter is list of items. Each of these can be in of the forms:
    // a) "filename to read and run"
    // b) ["source code", "indicative filename for debuging"]
    var runMulti = function (files, callback) {
        var loadedCount = 0;
        var firstError;
        var sources = [];
        var filenames = [];
        sources.length = files.length;
        filenames.length = files.length;

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
                if (loadedCount === files.length) {
                    // we've got everything loaded, so now run them
                    runSources();
                }
            };
        };

        for (var i = 0; i < files.length; i++) {
            if (files[i] instanceof Array) {
                sources[i] = files[i][0];
                filenames[i] = files[i][1];
                loadedCount++;
                if (loadedCount === files.length) {
                    // we've got everything loaded, so now run them
                    runSources();
                }
            }
            else {
                filenames[i] = files[i];
                fs.readFile(
                    files[i],
                    'utf8',
                    makeLoadHandler(i)
                );
            }
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

        // Deprecated, provided for compat only
        runFiles: runMulti,

        runMulti: runMulti,

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
            if (modules === undefined) {
                modules = element;
                element = document;
            }
            return rawContext.angular.bootstrap(element, modules);
        },

        element: function (param) {
            return rawContext.angular.element(param);
        },

        onDispose: function (cb) {
            disposeCallbacks.push(cb);
        },

        dispose: function () {
            // First call the dispose callbacks to give callers an opportunity to clean up
            // any pending async events. (If they don't do this then the app can crash
            // when the operations complete, since their state has been freed.)
            for (var i = 0; i < disposeCallbacks.length; i++) {
                disposeCallbacks[i](this);
            }
            window.close();
        }
    };
};

exports.Context = Context;
