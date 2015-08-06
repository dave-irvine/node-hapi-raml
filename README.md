hapi-raml
----

This library will take your RAML, parse it using `raml-parser`, and then set up routes in `hapi` to match your RAML.

##Usage

Require in hapi-raml, and pass it a reference to your hapi server, a hashmap of your Controllers, and the path to your
RAML.

When you're ready, call `hookup()`, and hapi-raml will link up your hapi routes to your Controllers, and return a
Promise that will tell you when it has finished. Then you can start your hapi server.

```
var HapiRaml = require('hapi-raml');
var server = new Hapi.Server();

var controllers = {};
controllers.MyController = new MyController();

var hapiRaml = new HapiRaml(server, controllers, './my.raml');

hapiRaml.hookup().then(function () {
    server.connection({ port: 3000 });
    server.start();
});
```

##Conventions

We borrow the collection/collection-item pattern from RAML and layer Controllers on top.

Your Controllers should feature at least the following functions, which should expect to receive the Hapi object
`request`, and a callback `reply`.

#####(API Root)/collection maps to `list()`

Returns an Array of instances of the matching Model for this Controller.

#####(API Root)/collection/{id} maps to `fetch()`

Returns a single instance of the matching Model for this Controller.

#####(API Root)/collection/{id}/(anything) maps to `(anything)()`

Whatever you decide!
