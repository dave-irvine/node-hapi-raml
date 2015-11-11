var Hapi = require('hapi');
var HapiRaml = require('hapi-raml');
var Basic = require('hapi-auth-basic');

//Load and instantiate our Controllers
var SimpleController = require('./controllers/SimpleController');

var controllers = {
	SimpleController: new SimpleController()
};

//Create a new Hapi Server.
var server = new Hapi.Server();

//Instantiate HapiRaml, passing our Hapi Server, Controllers, and path to a RAML file.
var hapiRaml = new HapiRaml(server, controllers, './basicAuth.raml');

server.connection({ port: 3000 });

server.register(Basic, function (err) {
    server.auth.strategy('myBasicAuth', 'basic', { validateFunc: function () {} });

    //Hookup the routes.
    hapiRaml.hookup().then(function () {
	//We could now start our Hapi Server
	console.log('All routes hooked up');
    })
    .catch(function (err) {
	//There was some problem doing the hookups.
	console.log(err);
    });
});
