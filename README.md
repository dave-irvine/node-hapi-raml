[![Build Status](https://travis-ci.org/dave-irvine/node-hapi-raml.svg?branch=master)](https://travis-ci.org/dave-irvine/node-hapi-raml)
[![NPM](https://nodei.co/npm/hapi-raml.png?mini=true)](https://nodei.co/npm/hapi-raml/)
hapi-raml
----

This library will take your RAML, parse it using `raml-parser`, and then set up routes in `hapi` to match your RAML.

##Installation

```npm install hapi-raml```

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

server.connection({ port: 3000 });

hapiRaml.hookup().then(function () {
    server.start();
});
```

##Conventions

We borrow the collection/collection-item pattern from RAML and layer Controllers on top.

Your Controllers should feature at least the following functions, which should expect to receive the Hapi object
`request`, and a callback `reply`.

#####GET (API Root)/collection maps to `list()`

Returns an Array of instances of the matching Model for this Controller.

#####GET (API Root)/collection/{id} maps to `fetch()`

Returns a single instance of the matching Model for this Controller.

#####DELETE (API Root)/collection/{id} maps to `delete()`

Deletes the matching Model for this Controller.

#####POST (API Root)/collection/{id} maps to `update()`

Updates the matching Model for this Controller.

#####ANY (API Root)/collection/{id}/(anything) maps to `(anything)()`

Whatever you decide!
