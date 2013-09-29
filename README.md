# angularcontext

Use AngularJS in Node applications.

## Introduction

[AngularJS](http://angularjs.org/) is a framework for building single-page applications that run
in a web browser. To make use of the full power of AngularJS it has to be run in a browser, but
a subset of AngularJS can be used within Node applications. This module exists to provide a
bridge between NodeJS and AngularJS.

Some possible applications of this capability include:

- Inspect an Angular application's routes on the server so that the server can produce a real 404 response when no route matches.
- Inspect an application's routes and run its `resolve` functions on the server so that the results can be delivered to the client in a single round-trip.
- With the help of something like `jsdom`, render static versions of pages to return to robot clients like search engine crawlers that don't run JavaScript code.

This module provides the bridge to AngularJS and enough DOM to allow the AngularJS injector and
compiler to work. For most applications further work will be required to override the built-in
implementations of various services in order to integrate them with the NodeJS application and
in order to prevent behaviors that make sense in the browser but don't make sense in Node.

## Hurdles

Unfortunately there are a couple of hurdles to jump before this module can be used.

The first hurdle, that applies to all users, is getting hold of a copy of AngularJS. The stock
build from the website should work fine. The author tested this module primarily with version 1.2.0.

The second hurdle is that this module uses the node module `contextify` to
provide a separated context in which to instantiate AngularJS. This module contains some native
code and so it can only be installed on systems that have a compiler available. Mac OS users will
therefore need XCode installed, Linux users will need `gcc` available, while Windows users might
want to check out
[the Windows Installation Guide for `contextify`](https://github.com/brianmcd/contextify/wiki/Windows-Installation-Guide).

## Installation

Installation is straightforward aside from the `contextify` hurdle mentioned above. Try:

```
npm install angularcontext
```

This module doesn't include AngularJS, so you'll have to obtain a copy of it elsewhere and
bundle it with your calling application.

## Usage

You can `require` the module in the usual way:

```js
var angularcontext = require('angularcontext');
```

When AngularJS is running in the browser it has a registry of modules that is global to the
application. However, system-wide globals would be a menace in the Node environment so this
module provides isolated AngularJS contexts that each contain their own module registry.
Instantiate a context to get started:

```js
var context = angularcontext.Context();
```

Before the context will do anything useful it needs to at least have some version of AngularJS
loaded into it. The `runFile` function provides a way to achieve this given a version of Angular
available in a file somewhere:

```js
context.runFile(
    'angular.js',
    function (result, error) {
        if (error) {
            console.error(error);
        }
        else {
            // can now use other methods of the context
        }
    }
);
```

At the point indicated by a comment in the above example, assuming that the provided AngularJS
module executed successfully, the core `ng` module will be available for use and some simple
parts of AngularJS will work without any further tweaking. The `injector` method allows us
to obtain an AngularJS injector object that we can use to instantiate AngularJS services as
normal:

```js
var $injector = context.injector(['ng']);
$injector.invoke(
    function ($rootScope, $parse) {
        var template = $parse('"Hello, " + name');
        $rootScope.name = 'Bob';
        console.log(template($rootScope)); // logs "Hello, Bob".
    }
);
```

However, to do most useful things it's necessary to register further modules that either provide
application-specific functionality or override certain built-in AngularJS services whose normal
implementations are inappropriate in the non-browser environment.

One way to do that is to load additional scripts using `runFile`. Repeated calls to this method
are somewhat like having a sequence of `script` elements in an HTML document, in that they will
all run in the same global scope. The `angular` global object is available here, along with
a somewhat-browser-like DOM API.

As a convenience there is also a `runFiles` method (note the plural) that takes an array of
filenames and executes them in the order they are provided. Commonly a caller will load the
AngularJS core plus some AngularJS modules and then some application code.

A more powerful method is to directly register a module from the normal NodeJS context. This allows
you to provide a module that makes use of NodeJS functionality and libraries such as `jsdom`.
This can be done by calling the `module` method, which works just like the equivalent method
on the global `angular` object when running in a browser.

```js
var fs = require('fs');
var module = context.module('nodeFilesystem', []);
module.factory(
    'nodeFilesystem',
    function () {
        return fs;
    }
);
```

You can create an injector with any combination of normal AngularJS modules and NodeJS-flavored
modules:

```js
var injector = context.injector(['ng', 'nodeFilesystem']);
```

If you provide a module that overrides service names declared in `ng`, be sure to list it
*after* the `'ng'` entry in the module list, since AngularJS uses a 'last declaration wins'
rule for resolving conflicts.

When you're done with your AngularJS context you must be sure to call `dispose` on it to avoid
a memory leak:

```js
context.dispose();
```

After you've called `dispose` you should not call any further methods on the `context` object. The
behavior when calling methods on a disposed context is undefined and may even result in crashing
the entire node process.

## Contributing

Development environment setup is pretty standard: just clone the git repo and run `npm install`
within it.

Contributions are welcome but are assumed to be licensed under the MIT license, as this package
itself is. Please be sure to run the unit tests (such that they are) and the linter on your
modified version, and then open a pull request.

```
npm test
npm run-script lint
```

The project's code style is represented by the `.jshintrc` file but please also attempt to remain
consistent with the prevailing style even if particular details *aren't* tested for by the linter.
