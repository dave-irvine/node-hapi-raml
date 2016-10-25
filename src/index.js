'use strict';

import fs from 'fs';
import RAML from './utils/RAML';
import ramlParser from 'raml-1-parser';
import _ from 'lodash';
import dbg from 'debug';

let debug = dbg('Hapi-RAML');

export default class HapiRaml {
    constructor(server, controllersMap, ramlPath) {
        debug('constructor()');
        if (server === undefined || server.route === undefined || typeof server.route !== 'function') {
            throw new Error('Missing `server` dependency.');
        }

        if (controllersMap === undefined || typeof controllersMap === 'string') {
            throw new Error('Missing `controllersMap` dependency.');
        }

        this.server = server;
        this.controllersMap = controllersMap;

        this.raml = new RAML(fs, ramlParser, ramlPath);
    }

    hookup() {
        return new Promise((resolve, reject) => {
            let controllersMap = this.controllersMap,
                server = this.server;

            this.raml.getRouteMap()
            .then(function (routeMap) {
                _.each(routeMap, (route) => {
                    let routeOptions = {};

                    //The controllersMap must contain the Controller class for this route
                    let controller = controllersMap[route.className];

                    if (controller === undefined) {
                        return reject(new Error(`Tried to find Controller '${route.className}' but it did not exist.`));
                    }

                    let controllerFunction = controller[route.classFunction];

                    //The Controller class for this route must contain the function for this route
                    if (controllerFunction === undefined || typeof controllerFunction !== 'function') {
                        return reject(new Error(`Tried to find '${route.classFunction}' on Controller '${route.className}' but it did not exist.`));
                    }

                    if (route.authStrategy !== undefined) {
                        /*
                            If the route has any authStrategies, then our auth mode is required.
                            We might override this later if the route has a null authStrategy because this will mean
                            that it is possible to access the route without auth.
                         */
                        let authOptions = {
                            mode: 'required'
                        };

                        //Filter out any authStrategies that are null
                        authOptions.strategies = _.filter(route.authStrategy, (authStrategy) => {
                            return authStrategy !== null;
                        });

                        //The route has a null authStrategy, so our auth mode for the entire route is optional
                        if (authOptions.strategies.length < route.authStrategy.length) {
                            authOptions.mode = 'optional';
                        }

                        //The only authStrategy is null, so auth should be false
                        if (authOptions.strategies.length === 0) {
                            routeOptions.auth = false;
                        } else {
                            routeOptions.auth = authOptions;
                        }
                    }

                    server.route({
                        method: route.method,
                        path: route.uri,
                        config: routeOptions,
                        handler: (request, reply) => {
                            controllerFunction.apply(controller, [request, reply]);
                        }
                    });
                });

                return resolve();
            })
            .catch((err) => {
                reject(err);
            });
        });
    }
}
