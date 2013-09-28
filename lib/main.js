'use strict';

var contextify = require('contextify');
var fs = require('fs');

var Context = function () {
    var rawContext = contextify();

    rawContext.globals = rawContext.getGlobal();

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
            return rawContext.angular.inject(modules);
        },

        dispose: function () {
            rawContext.dispose();
        }
    };
};

exports.Context = Context;
