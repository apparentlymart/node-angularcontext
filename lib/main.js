'use strict';

var jsdom = require('jsdom');
var fs = require('fs');
var vm = require('vm');

var Context = function (template) {
    // We provide an empty DOM that allows some basic parts of AngularJS to work,
    // but we're not actually expecting to render an app in here... it just gives
    // us an anchor document so we can do things like call document.createElement
    // when using jqLite/jQuery.
    var document = jsdom.jsdom(
        template,
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
    var window = document.defaultView;
    vm.createContext(window);
    var rawContext = window;
    var runner = function (code, filename) {
        vm.runInContext(code, window, { filename: filename });
    };

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
                        runner(sources[i], filenames[i]);
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
            runner(source, filename);
        },

        runFile: function (fileName, callback) {
            runMulti([fileName], callback);
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

        attachConsole: function (newConsole) {
            newConsole = newConsole || console;
            rawContext.console = newConsole;
        },

        attachListener: function (name, cb) {
            rawContext.addEventListener(name, cb);
        },

        setGlobal: function (name, value) {
            rawContext[name] = value;
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
            // In 'normal' angular the $rootElement isn't provided unless you go through
            // angular.bootstrap, but we deviate from that here and register a provider
            // for $rootElement that will only succeed if the bootstrap extension method
            // has been called on the injector before use. This allows callers to selectively
            // 'upgrade' injectors to have root elements when needed, while skipping template
            // compilation altogether when not needed.
            var $rootElement; // only available if we subsequently bootstrap

            modules.unshift(
                function ($provide) {
                    $provide.provider(
                        '$rootElement',
                        function () {
                            return {
                                $get: function () {
                                    if ($rootElement) {
                                        return $rootElement;
                                    }
                                    else {
                                        throw new Error(
                                            '$rootElement not available: injector not bootstrapped'
                                        );
                                    }
                                }
                            };
                        }
                    );
                }
            );

            var $injector = rawContext.angular.injector(modules);

            $injector.bootstrap = function bootstrap(element) {
                if (! element) {
                    element = document;
                }
                element = rawContext.angular.element(element);
                $rootElement = element;
                $injector.invoke(
                    function ($rootScope, $compile) {
                        element.data('$injector', $injector);
                        $compile(element)($rootScope);
                    }
                );
            };

            return $injector;
        },

        bootstrap: function (element, modules) {
            if (modules === undefined) {
                modules = element;
                element = document;
            }
            modules.unshift('ng');
            var $injector = this.injector(modules);
            var $rootScope = $injector.get('$rootScope');
            $rootScope.$apply(
                function () {
                    $injector.bootstrap(element);
                }
            );
            return $injector;
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
