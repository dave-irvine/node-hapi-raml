import SimpleController from './controllers/SimpleController';
import HapiRaml from '../../';
import Hapi from './FakeHapi';

export default () => {
	//Instantiate our Controllers
	let controllers = {
		SimpleController: new SimpleController()
	};

	//Create a new Hapi Server.
	let server = new Hapi.Server();

	//Instantiate HapiRaml, passing our Hapi Server, Controllers, and path to a RAML file.
	let hapiRaml = new HapiRaml(server, controllers, '../simple.raml');

	//Hookup the routes.
	hapiRaml.hookup().then(() => {
		//We could now start our Hapi Server
		console.log('All routes hooked up');
	})
	.catch((err) => {
		//There was some problem doing the hookups.
		console.log(err);
	});
}
