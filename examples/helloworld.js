
// This example expects angular.js to be available in the current working directory.
// Get a copy from the AngularJS website to try it. Originally tested with AngularJS 1.2.0.

var angularcontext = require('../lib/main.js');

var context = angularcontext.Context();
context.runFile(
    __dirname + '/../node_modules/angular/angular.js',
    function () {

        var injector = context.injector(['ng']);

        injector.invoke(
            function ($rootScope, $compile) {

                // Compile a template.
                var link = $compile(
                    '<div>{{ greeting }} {{ name }}</div>'
                );

                // Link the template to the scope to create a data-bound element.
                var element = link($rootScope);

                // Populate the root scope. Out here in node land we have to run
                // a digest cycle manually, so we use $apply.
                $rootScope.$apply(
                    function () {
                        $rootScope.greeting = 'hello';
                        $rootScope.name = 'world';
                    }
                );

                console.log(element.html());

                // Update the root scope to observe the automatic data binding in action.
                // (we have to use $apply again, just as we did above.)
                $rootScope.$apply(
                    function () {
                        $rootScope.greeting = 'goodbye';
                    }
                );

                console.log(element.html());

            }
        );
    }
);
